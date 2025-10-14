import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "..", "projects");

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function writeResult(category: string, filename: string, json: unknown) {
  const dir = path.join(ROOT, category);
  await ensureDir(dir);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf8");
  return filePath;
}

export async function writeLog(category: string, base: string, log: any) {
  const dir = path.join(ROOT, category);
  await ensureDir(dir);
  const filePath = path.join(dir, `${base}.log.json`);
  await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf8");
  return filePath;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\d]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}