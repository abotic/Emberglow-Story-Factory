import type { FastifyInstance, FastifyRequest } from "fastify";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "..", "projects");

async function listTree() {
  const out: Record<
    string,
    {
      name: string;
      items: { file: string; title: string; savedAt: number; minutes?: number; words?: number }[];
    }
  > = {};
  try {
    const cats = await fs.readdir(ROOT, { withFileTypes: true });
    for (const dirent of cats) {
      if (!dirent.isDirectory()) continue;
      const cat = dirent.name;
      const files = await fs.readdir(path.join(ROOT, cat));
      const entries: {
        file: string;
        title: string;
        savedAt: number;
        minutes?: number;
        words?: number;
      }[] = [];
      for (const f of files.filter((f) => f.endsWith(".json") && !f.endsWith(".log.json"))) {
        try {
          const p = path.join(ROOT, cat, f);
          const raw = await fs.readFile(p, "utf8");
          const j = JSON.parse(raw);
          const st = await fs.stat(p);
          entries.push({
            file: f,
            title: j.title || f,
            savedAt: st.mtimeMs,
            minutes: j?.meta?.target_minutes,
            words: j?.meta?.estimated_word_count,
          });
        } catch {}
      }
      entries.sort((a, b) => b.savedAt - a.savedAt);
      out[cat] = { name: cat, items: entries };
    }
  } catch {}
  return out;
}

export async function registerProjectRoutes(app: FastifyInstance) {
  app.get("/projects", async () => {
    return { tree: await listTree() };
  });

  app.get(
    "/project",
    async (
      req: FastifyRequest<{ Querystring: { category?: string; file?: string } }>,
      reply
    ) => {
      const { category, file } = req.query || {};
      if (!category || !file) return reply.code(400).send({ error: "category and file required" });
      const p = path.join(ROOT, category, file);
      try {
        const raw = await fs.readFile(p, "utf8");
        return JSON.parse(raw);
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    }
  );

  app.delete(
    "/project",
    async (
      req: FastifyRequest<{ Querystring: { category?: string; file?: string } }>,
      reply
    ) => {
      const { category, file } = req.query || {};
      if (!category || !file) return reply.code(400).send({ error: "category and file required" });
      const base = file.replace(/\.json$/i, "");
      const p = path.join(ROOT, category, `${base}.json`);
      const log = path.join(ROOT, category, `${base}.log.json`);
      try {
        await fs.unlink(p);
        try {
          await fs.unlink(log);
        } catch {}
        return { ok: true };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    }
  );
}
