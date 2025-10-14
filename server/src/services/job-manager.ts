import { env } from "../config/env.js";
import type { JobState, GenerateJobRequest, IngestJobRequest } from "../types.js";
import { runGenerateJob } from "./generator.js";
import { runIngestJob } from "./ingest.js";

type JobPayload = GenerateJobRequest | IngestJobRequest;

const jobs = new Map<string, JobState>();
const payloads = new Map<string, JobPayload>();
const canceled = new Set<string>();
const queue: string[] = [];
let runningCount = 0;

export function createJobId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function now(): number {
  return Date.now();
}

export function updateJob(job: JobState, patch: Partial<JobState>): void {
  Object.assign(job, patch, { updatedAt: now() });
}

export function getJob(id: string): JobState | undefined {
  return jobs.get(id);
}

export function getAllJobs(): JobState[] {
  return Array.from(jobs.values());
}

export function getJobPayload(id: string): JobPayload | undefined {
  return payloads.get(id);
}

export function getQueuePosition(id: string): number {
  return queue.indexOf(id);
}

export function getQueueStats() {
  return {
    running: runningCount,
    queued: queue.length,
    maxConcurrency: env.MAX_CONCURRENCY,
  };
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;

  canceled.add(id);
  const idx = queue.indexOf(id);
  if (idx >= 0) queue.splice(idx, 1);
  updateJob(job, { status: "canceled", message: "Canceled by user", progress: 100 });
  return true;
}

export function isCanceled(id: string): boolean {
  return canceled.has(id);
}

export function enqueueJob(body: JobPayload): string {
  const job: JobState = {
    id: createJobId(),
    status: "queued",
    progress: 0,
    message: "Queued",
    createdAt: now(),
    updatedAt: now(),
  };

  jobs.set(job.id, job);
  payloads.set(job.id, body);
  queue.push(job.id);
  schedule();
  return job.id;
}

function schedule(): void {
  while (runningCount < env.MAX_CONCURRENCY && queue.length > 0) {
    const nextId = queue.shift()!;
    const job = jobs.get(nextId);
    const body = payloads.get(nextId);

    if (!job || !body) continue;

    if (canceled.has(nextId)) {
      updateJob(job, { status: "canceled", message: "Canceled before start", progress: 100 });
      payloads.delete(nextId);
      continue;
    }

    runningCount++;
    const isIngest = "script" in body && typeof body.script === "string" && body.script.length > 0;
    const runner = isIngest ? runIngestJob(job, body as IngestJobRequest) : runGenerateJob(job, body as GenerateJobRequest);

    runner
      .catch((e: any) => {
        if (job && job.status !== "canceled") {
          updateJob(job, { status: "error", message: "Failed", error: String(e), progress: 100 });
        }
      })
      .finally(() => {
        runningCount = Math.max(0, runningCount - 1);
        payloads.delete(nextId);
        schedule();
      });
  }
}