import type { FastifyInstance } from "fastify";
import { openai, model, temperature } from "./openai.js";
import { env } from "./env.js";
import {
  GenerateJobRequestSchema,
  type GenerateJobRequest,
  GenerateResponseSchema,
  type JobState,
} from "./types.js";
import { buildSceneTimestamps } from "./utils/scene.js";
import {
  buildPrompt,
  buildAppendPrompt,
  buildSceneFixPrompt,
  buildSceneExtraPrompt,
  defaultsForType,
} from "./promptTemplate.js";
import { coerceLastJsonBlock } from "./utils/json.js";
import path from "node:path";
import { promises as fs } from "node:fs";

type JobMap = Map<string, JobState>;
const jobs: JobMap = new Map();
const payloads: Map<string, GenerateJobRequest> = new Map();
const canceled = new Set<string>();
const queue: string[] = [];
let runningCount = 0;

function id() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
function now() {
  return Date.now();
}
function update(job: JobState, patch: Partial<JobState>) {
  Object.assign(job, patch, { updatedAt: now() });
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\d]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}
async function writeResult(category: string, filename: string, json: unknown) {
  const root = path.resolve(process.cwd(), "..", "projects", category);
  await ensureDir(root);
  const out = path.join(root, filename);
  await fs.writeFile(out, JSON.stringify(json, null, 2), "utf8");
  return out;
}
async function writeLog(category: string, base: string, log: any) {
  const root = path.resolve(process.cwd(), "..", "projects", category);
  await ensureDir(root);
  const out = path.join(root, `${base}.log.json`);
  await fs.writeFile(out, JSON.stringify(log, null, 2), "utf8");
  return out;
}

function schedule() {
  while (runningCount < env.MAX_CONCURRENCY && queue.length > 0) {
    const nextId = queue.shift()!;
    const job = jobs.get(nextId);
    const body = payloads.get(nextId);
    if (!job || !body) continue;

    if (canceled.has(nextId)) {
      update(job, { status: "canceled", message: "Canceled before start", progress: 100 });
      payloads.delete(nextId);
      continue;
    }

    runningCount++;
    runJob(job, body)
      .catch((e) => {
        if (job && job.status !== "canceled") {
          update(job, { status: "error", message: "Failed", error: String(e), progress: 100 });
        }
      })
      .finally(() => {
        runningCount = Math.max(0, runningCount - 1);
        payloads.delete(nextId);
        schedule();
      });
  }
}

export async function registerJobRoutes(app: FastifyInstance) {
  app.post("/jobs", async (req, reply) => {
    const parsed = GenerateJobRequestSchema.safeParse(req.body);
    if (!parsed.success)
      return reply.code(400).send({ error: "Invalid request", details: parsed.error.flatten() });

    const body: GenerateJobRequest = parsed.data;
    const j: JobState = {
      id: id(),
      status: "queued",
      progress: 0,
      message: "Queued",
      createdAt: now(),
      updatedAt: now(),
    };
    jobs.set(j.id, j);
    payloads.set(j.id, body);
    queue.push(j.id);

    reply.send({ id: j.id });
    schedule();
  });

  app.get("/jobs", async (_req, reply) => {
    const list = Array.from(jobs.values()).map((j) => {
      const p = payloads.get(j.id);
      const queue_index = j.status === "queued" ? queue.indexOf(j.id) : -1;
      return {
        ...j,
        story_type: p?.story_type,
        target_minutes: p?.target_minutes,
        history_topic: p?.history_topic,
        queue_index: queue_index >= 0 ? queue_index : undefined,
      };
    });
    reply.send({
      jobs: list,
      running: runningCount,
      queued: queue.length,
      maxConcurrency: env.MAX_CONCURRENCY,
    });
  });

  app.get("/jobs/:id", async (req, reply) => {
    const job = jobs.get((req.params as any).id);
    if (!job) return reply.code(404).send({ error: "Not found" });
    reply.send(job);
  });

  app.delete("/jobs/:id", async (req, reply) => {
    const jobId = (req.params as any).id;
    const job = jobs.get(jobId);
    if (!job) return reply.code(404).send({ error: "Not found" });
    canceled.add(jobId);
    const idx = queue.indexOf(jobId);
    if (idx >= 0) queue.splice(idx, 1);
    update(job, { status: "canceled", message: "Canceled by user", progress: 100 });
    return reply.send({ ok: true });
  });

  app.options("/jobs/:id/stream", async (_req, reply) => {
    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "GET,OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type")
      .send();
  });

  app.get("/jobs/:id/stream", async (req, reply) => {
    const jobId = (req.params as any).id;
    const job = jobs.get(jobId);
    if (!job) return reply.code(404).send("Not found");

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Accel-Buffering": "no",
    });

    const send = (data: any) => reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    const ping = () => reply.raw.write(`: heartbeat\n\n`);

    send(job);
    const hb = setInterval(ping, 15000);
    const tick = setInterval(() => {
      const j = jobs.get(jobId);
      if (j) send(j);
      if (!j || j.status === "done" || j.status === "error" || j.status === "canceled") {
        clearInterval(tick);
        clearInterval(hb);
        try {
          reply.raw.end();
        } catch {}
      }
    }, env.JOB_STREAM_INTERVAL_MS);

    req.raw.on("close", () => {
      clearInterval(tick);
      clearInterval(hb);
      try {
        reply.raw.end();
      } catch {}
    });
  });
}

async function runJob(job: JobState, body: GenerateJobRequest) {
  const t0 = Date.now();
  const log: any = { id: job.id, story_type: body.story_type, target_minutes: body.target_minutes, steps: [] };

  if (canceled.has(job.id)) {
    update(job, { status: "canceled", message: "Canceled before start", progress: 100 });
    return;
  }

  update(job, { status: "running", progress: 3, message: "Preparing prompt" });

  const presets = defaultsForType(body.story_type);
  const category = body.story_type;
  const topic =
    body.story_type === "history_learning"
      ? body.history_topic && body.history_topic.trim().length > 0
        ? body.history_topic
        : "A pivotal but underrated turning point in world history"
      : `An original ${body.story_type.replace("_", " ")} tale`;

  const stamps = buildSceneTimestamps(body.target_minutes, 30);
  const requiredWords = body.target_minutes * env.READING_RATE_WPM;

  const prompt = buildPrompt({
    brand: presets.brand,
    channel: presets.channel,
    niche: presets.niche,
    topic,
    target_minutes: body.target_minutes,
    voice_style: presets.voice,
    language: "English",
    scene_stamps: stamps,
    reading_rate_wpm: env.READING_RATE_WPM,
    required_word_count: requiredWords,
  });

  if (canceled.has(job.id)) {
    update(job, { status: "canceled", message: "Canceled", progress: 100 });
    return;
  }
  update(job, { progress: 10, message: "Generating initial draft…" });
  const c0 = Date.now();
  const initial = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: "You are a senior narrative showrunner and YouTube SEO producer." },
      { role: "user", content: prompt },
    ],
  });
  const c1 = Date.now();
  log.steps.push({ name: "initial", ms: c1 - c0, usage: initial.usage ?? null });

  if (canceled.has(job.id)) {
    update(job, { status: "canceled", message: "Canceled", progress: 100 });
    return;
  }

  const raw = initial.choices?.[0]?.message?.content ?? "";
  let jsonOut: any;
  try {
    jsonOut = coerceLastJsonBlock(raw);
  } catch (e) {
    throw new Error("Model did not return valid JSON on initial pass: " + String(e));
  }
  let shaped = GenerateResponseSchema.parse(jsonOut);

  let wc = (shaped.script.trim().match(/\S+/g) ?? []).length;
  const target = requiredWords;
  const tolerance = Math.floor(target * env.UNDERFLOW_TOLERANCE);
  let passes = 0;

  while (wc < target - tolerance && passes < env.MAX_APPEND_PASSES) {
    if (canceled.has(job.id)) {
      update(job, { status: "canceled", message: "Canceled", progress: 100 });
      return;
    }
    passes++;
    update(job, { progress: 20 + passes * 10, message: `Extending script (pass ${passes})…` });
    const appendPrompt = buildAppendPrompt(wc, target);
    const a0 = Date.now();
    const append = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: "system", content: "You are a senior narrative showrunner. Continue seamlessly." },
        { role: "user", content: appendPrompt },
      ],
    });
    const a1 = Date.now();
    log.steps.push({ name: `append_${passes}`, ms: a1 - a0, usage: append.usage ?? null });
    const appendRaw = append.choices?.[0]?.message?.content ?? "";
    const { script_append } = coerceLastJsonBlock(appendRaw);
    if (!script_append || typeof script_append !== "string") break;
    shaped.script += `\n\n${script_append}`;
    wc = (shaped.script.trim().match(/\S+/g) ?? []).length;
  }

  if (canceled.has(job.id)) {
    update(job, { status: "canceled", message: "Canceled", progress: 100 });
    return;
  }
  update(job, { progress: 60, message: "Aligning scene prompts…" });
  if (!Array.isArray(shaped.scene_prompts) || shaped.scene_prompts.length !== stamps.length) {
    const f0 = Date.now();
    const fix = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: "system", content: "You align visual beats to timestamps precisely." },
        { role: "user", content: buildSceneFixPrompt(stamps) },
      ],
    });
    const f1 = Date.now();
    log.steps.push({ name: "scene_fix", ms: f1 - f0, usage: fix.usage ?? null });

    const fixRaw = fix.choices?.[0]?.message?.content ?? "";
    const { scene_prompts_full } = coerceLastJsonBlock(fixRaw);
    if (Array.isArray(scene_prompts_full) && scene_prompts_full.length === stamps.length) {
      shaped.scene_prompts = scene_prompts_full;
    }
  }

  if (canceled.has(job.id)) {
    update(job, { status: "canceled", message: "Canceled", progress: 100 });
    return;
  }
  const extraCount = Math.max(1, Math.ceil(stamps.length * 0.2));
  update(job, { progress: 70, message: "Adding extra scenery…" });
  const e0 = Date.now();
  const extra = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: "You extend visual coverage coherently with extra scenery." },
      { role: "user", content: buildSceneExtraPrompt(extraCount) },
    ],
  });
  const e1 = Date.now();
  log.steps.push({ name: "scene_extra", ms: e1 - e0, usage: extra.usage ?? null });
  try {
    const extraJson = coerceLastJsonBlock(extra.choices?.[0]?.message?.content ?? "{}");
    if (Array.isArray(extraJson.extra_scenes)) {
      for (const it of extraJson.extra_scenes) {
        if (it && typeof it.prompt === "string") shaped.scene_prompts.push({ prompt: it.prompt });
      }
    }
  } catch {}

  shaped.meta = {
    ...shaped.meta,
    brand: presets.brand,
    channel: presets.channel,
    niche: presets.niche,
    target_minutes: body.target_minutes,
    reading_rate_wpm: env.READING_RATE_WPM,
    estimated_word_count: (shaped.script.trim().match(/\S+/g) ?? []).length,
  };

  if (canceled.has(job.id)) {
    update(job, { status: "canceled", message: "Canceled", progress: 100 });
    return;
  }
  update(job, { status: "saving", progress: 85, message: "Saving to disk…" });
  const base = slugify(shaped.title || topic) || `story-${job.id}`;
  const fileName = `${base}.json`;
  const saved = await writeResult(category, fileName, shaped);

  const t1 = Date.now();
  const logObj = {
    id: job.id,
    story_type: body.story_type,
    target_minutes: body.target_minutes,
    steps: log.steps,
    total_ms: t1 - t0,
    final_words: shaped.meta.estimated_word_count,
    saved,
  };
  await writeLog(category, base, logObj);

  update(job, { status: "done", progress: 100, message: "Completed", resultPath: saved });
}
