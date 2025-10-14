import { env } from "../config/env.js";
import type { IngestJobRequest, JobState } from "../types.js";
import { buildSceneTimestamps, stampToSeconds } from "../utils/scene.js";
import { coerceLastJsonBlock } from "../utils/json.js";
import { writeResult, writeLog, slugify } from "../utils/storage.js";
import { isCanceled, updateJob } from "./job-manager.js";
import { buildIngestMetadataPrompt, buildSceneFixPrompt, squeezeScriptForMetadata } from "./prompts.js";
import { openai, model, temperature } from "./openai";

export async function runIngestJob(job: JobState, body: IngestJobRequest): Promise<void> {
  const t0 = Date.now();
  const log: any = {
    id: job.id,
    story_type: body.story_type,
    ingest: true,
    steps: [],
  };

  try {
    updateJob(job, { status: "running", progress: 5, message: "Step 1/4: Reading script..." });
    const totalWords = (body.script.trim().match(/\S+/g) ?? []).length;
    const effectiveMinutes = body.target_minutes ?? Math.max(5, Math.min(240, Math.round(totalWords / env.READING_RATE_WPM)));

    const { excerpt } = squeezeScriptForMetadata(body.script);
    const metaPrompt = buildIngestMetadataPrompt({
      approx_minutes: effectiveMinutes,
      total_words: totalWords,
      excerpt,
    });

    const metaCompletion = await openai.chat.completions.create({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return STRICT JSON only." },
        { role: "user", content: metaPrompt },
      ],
    });

    let result: any = coerceLastJsonBlock(metaCompletion.choices[0].message.content || "{}");
    log.steps.push({ name: "ingest_metadata", usage: metaCompletion.usage });
    if (isCanceled(job.id)) throw new Error("Canceled by user");
    result.script = body.script.trim();

    updateJob(job, { progress: 25, message: "Step 2/4: Laying out timestamps..." });
    const stamps = buildSceneTimestamps(effectiveMinutes);
    const totalSeconds = effectiveMinutes * 60;
    let coreCount = stamps.findIndex((s) => stampToSeconds(s) > totalSeconds);
    if (coreCount === -1) coreCount = stamps.length;

    updateJob(job, { progress: 40, message: "Step 3/4: Generating visuals..." });
    const mergedPrompts: any[] = [];
    const chunkSize = env.MAX_SCENE_STAMPS_PER_PASS;
    const overlap = env.SCENE_SCRIPT_OVERLAP_CHARS;
    const scriptLen = result.script.length;

    for (let i = 0; i < stamps.length; i += chunkSize) {
      const end = Math.min(stamps.length, i + chunkSize);
      const chunkStamps = stamps.slice(i, end);
      const startRatio = i / Math.max(1, coreCount);
      const endRatio = end / Math.max(1, coreCount);
      const charStart = Math.max(0, Math.floor(startRatio * scriptLen) - overlap);
      const charEnd = Math.min(scriptLen, Math.ceil(endRatio * scriptLen) + overlap);
      const scriptSlice = result.script.slice(charStart, charEnd);

      const sceneFixPrompt = buildSceneFixPrompt(chunkStamps, scriptSlice);
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
      if (Array.isArray(scene_prompts_full)) mergedPrompts.push(...scene_prompts_full);
      log.steps.push({ name: `scene_chunk_${i / chunkSize + 1}`, usage: sceneFixCompletion.usage });
      if (isCanceled(job.id)) throw new Error("Canceled by user");

      const pct = 40 + Math.floor((end / stamps.length) * 50);
      updateJob(job, { progress: Math.min(90, pct), message: `Step 3/4: Visuals ${end}/${stamps.length}...` });
    }
    result.scene_prompts = mergedPrompts;

    updateJob(job, { progress: 95, message: "Step 4/4: Saving..." });
    const hashtagsArray: string[] = Array.isArray(result.hashtags) ? result.hashtags : [];
    result.description = `${(result.description ?? "").trim()}\n\n${hashtagsArray.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
    result.meta = {
      target_minutes: effectiveMinutes,
      reading_rate_wpm: env.READING_RATE_WPM,
      estimated_word_count: totalWords,
      ingest: true,
      packaging_style: body.packaging_style,
      narration_mode: body.narration_mode,
      seed_topic: body.seed_topic,
    };

    const base = slugify(result.title || `ingested-${job.id}`) || `ingested-${job.id}`;
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