import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { GenerateJobRequestSchema, IngestJobRequestSchema } from "../types.js";
import { enqueueJob, getAllJobs, getJobPayload, getQueuePosition, getQueueStats, getJob, cancelJob } from "../services/job-manager.js";

export async function registerJobRoutes(app: FastifyInstance) {
    app.post("/jobs", async (req, reply) => {
        const parsed = GenerateJobRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: "Invalid request", details: parsed.error.flatten() });
        }

        const jobId = enqueueJob(parsed.data);
        return reply.send({ id: jobId });
    });

    app.post("/ingest", async (req, reply) => {
        const parsed = IngestJobRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: "Invalid request", details: parsed.error.flatten() });
        }

        const body = parsed.data;
        const words = (body.script.trim().match(/\S+/g) ?? []).length;
        const computedMinutes = Math.max(5, Math.min(240, Math.round(words / env.READING_RATE_WPM)));
        const effective = { ...body, target_minutes: body.target_minutes ?? computedMinutes };

        const jobId = enqueueJob(effective);
        return reply.send({ id: jobId });
    });

    app.get("/jobs", async () => {
        const list = getAllJobs().map((j) => {
            const p = getJobPayload(j.id);
            const queue_index = j.status === "queued" ? getQueuePosition(j.id) : -1;
            return {
                ...j,
                story_type: p?.story_type,
                target_minutes: p?.target_minutes,
                queue_index: queue_index >= 0 ? queue_index : undefined,
            };
        });

        return { jobs: list, ...getQueueStats() };
    });

    app.get("/jobs/:id", async (req, reply) => {
        const job = getJob((req.params as any).id);
        if (!job) return reply.code(404).send({ error: "Not found" });
        return job;
    });

    app.delete("/jobs/:id", async (req, reply) => {
        const jobId = (req.params as any).id;
        const success = cancelJob(jobId);
        if (!success) return reply.code(404).send({ error: "Not found" });
        return { ok: true };
    });

    app.get("/jobs/:id/stream", async (req, reply) => {
        const jobId = (req.params as any).id;
        const job = getJob(jobId);
        if (!job) return reply.code(404).send("Not found");

        reply.hijack();
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "X-Accel-Buffering": "no",
        });

        const send = (data: any) => reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        const tick = setInterval(() => {
            const j = getJob(jobId);
            if (j) send(j);
            if (!j || ["done", "error", "canceled"].includes(j.status)) {
                clearInterval(tick);
                try {
                    reply.raw.end();
                } catch { }
            }
        }, env.JOB_STREAM_INTERVAL_MS);

        req.raw.on("close", () => {
            clearInterval(tick);
            try {
                reply.raw.end();
            } catch { }
        });
    });
}