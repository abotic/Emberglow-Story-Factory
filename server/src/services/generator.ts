import { env } from "../config/env.js";
import type { GenerateJobRequest, JobState } from "../types.js";
import { buildSceneTimestamps } from "../utils/scene.js";
import { coerceLastJsonBlock } from "../utils/json.js";
import { writeResult, writeLog, slugify } from "../utils/storage.js";
import { isCanceled, updateJob } from "./job-manager.js";
import {
  buildInitialPrompt,
  buildTitleVariantsPrompt,
  buildTitleRankerPrompt,
  buildOutlinePrompt,
  buildChapterPrompt,
  buildSceneFixPrompt,
} from "./prompts.js";
import { openai, model, temperature } from "./openai";

function reconcileOutlineTotals(outline: any[], required: number): any[] {
  const sum = outline.reduce((a, c) => a + (c.estimated_words || 0), 0);
  const delta = required - sum;
  if (delta !== 0 && outline.length > 0) {
    const last = outline[outline.length - 1];
    last.estimated_words = Math.max(50, (last.estimated_words || 0) + delta);
  }
  return outline;
}

export async function runGenerateJob(job: JobState, body: GenerateJobRequest): Promise<void> {
  const t0 = Date.now();
  const log: any = {
    id: job.id,
    story_type: body.story_type,
    target_minutes: body.target_minutes,
    steps: [],
  };

  try {
    const initialSeed = body.seed_topic?.trim() || `An original ${body.story_type.replace("_", " ")} tale`;

    updateJob(job, { status: "running", progress: 5, message: "Step 1/5: Developing premise..." });
    const initialPrompt = buildInitialPrompt({ topic: initialSeed, target_minutes: body.target_minutes });
    const initialCompletion = await openai.chat.completions.create({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only." },
        { role: "user", content: initialPrompt },
      ],
    });

    const result = coerceLastJsonBlock(initialCompletion.choices[0].message.content || "{}");
    const { story_premise } = result;
    if (!story_premise?.hook) throw new Error("Failed to generate story premise");
    log.steps.push({ name: "story_premise", usage: initialCompletion.usage });
    if (isCanceled(job.id)) throw new Error("Canceled by user");

    const fullTopic = `${story_premise.hook} - ${story_premise.protagonist} ${story_premise.action}`;

    updateJob(job, { progress: 15, message: "Step 2/5: Generating titles..." });
    const titleGen = await openai.chat.completions.create({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only." },
        {
          role: "user",
          content: buildTitleVariantsPrompt({
            story_premise,
            count: env.TITLE_VARIANT_COUNT,
            maxLen: env.PACKAGING_TITLE_MAX_LEN,
          }),
        },
      ],
    });

    const { titles } = coerceLastJsonBlock(titleGen.choices[0].message.content || "{}");
    const titleRank = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only." },
        { role: "user", content: buildTitleRankerPrompt({ topic: fullTopic, maxLen: env.PACKAGING_TITLE_MAX_LEN }) },
        { role: "user", content: JSON.stringify({ titles }) },
      ],
    });

    const { ranked } = coerceLastJsonBlock(titleRank.choices[0].message.content || "{}");
    const altTitles = Array.isArray(ranked) && ranked.length ? ranked.map((r: any) => r.title) : titles || [];
    if (altTitles?.length) {
      result.alt_titles = altTitles;
      result.title = altTitles[0];
    }
    log.steps.push({ name: "title_lab", usage: { gen: titleGen.usage, rank: titleRank.usage } });
    if (isCanceled(job.id)) throw new Error("Canceled by user");

    updateJob(job, { progress: 25, message: "Step 3/5: Building outline..." });
    const requiredWords = body.target_minutes * env.READING_RATE_WPM;
    const outlinePrompt = buildOutlinePrompt(story_premise, requiredWords, body.story_type);
    const outlineCompletion = await openai.chat.completions.create({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only." },
        { role: "user", content: outlinePrompt },
      ],
    });

    let { outline } = coerceLastJsonBlock(outlineCompletion.choices[0].message.content || "{}");
    if (!Array.isArray(outline) || outline.length === 0) throw new Error("Failed to generate outline");
    outline = reconcileOutlineTotals(outline, requiredWords);
    log.steps.push({ name: "outline", usage: outlineCompletion.usage });
    if (isCanceled(job.id)) throw new Error("Canceled by user");

    let fullScript = "";
    for (let i = 0; i < outline.length; i++) {
      const progress = 35 + Math.floor((i / outline.length) * 40);
      updateJob(job, { progress, message: `Step 4/5: Writing chapter ${i + 1}/${outline.length}...` });

      const chapterPrompt = buildChapterPrompt(story_premise, requiredWords, outline, i, fullScript, body.narration_mode);
      const chapterCompletion = await openai.chat.completions.create({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return STRICT JSON only." },
          { role: "user", content: chapterPrompt },
        ],
      });

      const { script_chapter } = coerceLastJsonBlock(chapterCompletion.choices[0].message.content || "{}");
      if (!script_chapter) throw new Error(`Failed to generate chapter ${i + 1}`);
      fullScript += script_chapter + "\n\n";
      log.steps.push({ name: `chapter_${i + 1}`, usage: chapterCompletion.usage });
      if (isCanceled(job.id)) throw new Error("Canceled by user");
    }
    result.script = fullScript.trim();

    updateJob(job, { progress: 80, message: "Step 5/5: Generating visuals..." });
    const stamps = buildSceneTimestamps(body.target_minutes);
    const sceneFixPrompt = buildSceneFixPrompt(stamps, result.script);
    const sceneFixCompletion = await openai.chat.completions.create({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only." },
        { role: "user", content: sceneFixPrompt },
      ],
    });

    const { scene_prompts_full } = coerceLastJsonBlock(sceneFixCompletion.choices[0].message.content || "{}");
    result.scene_prompts = Array.isArray(scene_prompts_full) ? scene_prompts_full : [];
    log.steps.push({ name: "scene_prompts", usage: sceneFixCompletion.usage });
    if (isCanceled(job.id)) throw new Error("Canceled by user");

    const hashtagsArray: string[] = Array.isArray(result.hashtags) ? result.hashtags : [];
    const hashtagsString = hashtagsArray.length ? "\n\n" + hashtagsArray.map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" ") : "";
    result.description = (result.description ?? "").trim() + hashtagsString;

    result.meta = {
      target_minutes: body.target_minutes,
      reading_rate_wpm: env.READING_RATE_WPM,
      estimated_word_count: (result.script.trim().match(/\S+/g) ?? []).length,
      packaging_style: body.packaging_style,
      narration_mode: body.narration_mode,
      seed_topic: body.seed_topic,
      story_premise,
    };

    const base = slugify(result.title || `story-${job.id}`) || `story-${job.id}`;
    const fileName = `${base}.json`;
    const savedPath = await writeResult(body.story_type, fileName, result);
    log.total_ms = Date.now() - t0;
    await writeLog(body.story_type, base, log);
    updateJob(job, { status: "done", progress: 100, message: "Completed", resultPath: savedPath });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes("Canceled by user")) {
      updateJob(job, { status: "canceled", message: "Canceled by user", progress: 100 });
    } else {
      updateJob(job, { status: "error", message: "Error occurred", error: err.message, progress: 100 });
    }
  }
}