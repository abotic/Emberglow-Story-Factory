import type { FastifyInstance, FastifyRequest } from "fastify";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { coerceLastJsonBlock } from "../utils/json.js";
import { slugify } from "../utils/storage.js";
import { model, openai, temperature } from "../services/openai.js";

const ROOT = path.resolve(process.cwd(), "..", "projects");
const USED_FILE = path.join(ROOT, ".used-topics.json");

const SUBJECT_ALIASES: Record<string, string> = {
  bigfoot: "bigfoot",
  sasquatch: "bigfoot",
  yeti: "yeti",
  ufo: "ufo",
  ufos: "ufo",
  aliens: "ufo",
  nessie: "lochness",
  "loch ness": "lochness",
  lochness: "lochness",
  mothman: "mothman",
  chupacabra: "chupacabra",
  wendigo: "wendigo",
  "skinwalker ranch": "skinwalker_ranch",
  "bermuda triangle": "bermuda_triangle",
  "jersey devil": "jersey_devil",
  "men in black": "men_in_black",
  thunderbird: "thunderbird",
};

const SUBJECT_LABELS: Record<string, string> = {
  bigfoot: "Bigfoot",
  lochness: "Loch Ness",
  ufo: "UFO",
  mothman: "Mothman",
  skinwalker_ranch: "Skinwalker Ranch",
  bermuda_triangle: "Bermuda Triangle",
  chupacabra: "Chupacabra",
  wendigo: "Wendigo",
  jersey_devil: "Jersey Devil",
  men_in_black: "Men in Black",
  yeti: "Yeti",
  thunderbird: "Thunderbird",
};

const SEED_POOLS: Record<string, string[]> = {
  bigfoot: [
    "Lone hiker injured in fall is brought food and water by reclusive Bigfoot",
    "Veteran ranger finds Bigfoot nest and is silently stalked back to watchtower",
  ],
  lochness: [
    "Fishing boat capsized by massive serpentine creature in Loch Ness during storm",
    "Underwater photographer captures clear footage before being rammed by creature",
  ],
  ufo: [
    "Air Force pilot forced to engage with silent tic-tac shaped UFO that mirrors every move",
    "Rural family watches triangular UFO hover silently, causing power outage and time distortion",
  ],
  mothman: [
    "Late-night driver pursued along rural road by massive winged figure with glowing red eyes",
    "Factory workers see 7-foot creature with wings perched on roof hours before fatal accident",
  ],
  chupacabra: [
    "Rancher discovers dozens of livestock drained of blood with precise puncture wounds",
    "Thermal camera captures bipedal creature with spines running through Texas ranch at night",
  ],
  wendigo: [
    "Snowbound hikers resort to cannibalism, only to be hunted by skeletal antlered creature",
    "Park ranger investigating missing persons finds cave filled with gnawed human bones",
  ],
  yeti: [
    "Mountaineer rescued from crevasse by massive white-furred humanoid in Himalayas",
    "Sherpa guides refuse to continue after finding enormous footprints at base camp",
  ],
  thunderbird: [
    "Rancher watches bird with 30-foot wingspan carry off full-grown calf",
    "Native elder describes Thunderbird descending during storm to take fisherman",
  ],
  jersey_devil: [
    "Motorist's car breaks down in Pine Barrens and winged hoofed creature attacks vehicle",
    "Farmer discovers livestock eviscerated with claw marks on barn doors",
  ],
  men_in_black: [
    "UFO witness visited by two pale men in outdated suits who threaten him into silence",
    "Journalist investigating alien encounters has files stolen by mysterious agents",
  ],
  skinwalker_ranch: [
    "Rancher's cattle found mutilated with surgical precision and no tracks to bodies",
    "Family witnesses shape-shifting creature transform from wolf to humanoid figure",
  ],
  bermuda_triangle: [
    "Cargo ship's entire crew vanishes mid-voyage with vessel found drifting empty",
    "Pilot's final transmission describes instruments going haywire before plane disappears",
  ],
};

function canonicalSubject(s?: string): string {
  const raw = (s || "cryptid").trim().toLowerCase();
  return SUBJECT_ALIASES[raw] || raw;
}

async function readUsed(): Promise<Record<string, string[]>> {
  try {
    const raw = await fs.readFile(USED_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeUsed(j: Record<string, string[]>): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(USED_FILE, JSON.stringify(j, null, 2), "utf8");
}

async function generateTopics(subject: string, usedList: string[]): Promise<string[]> {
  const pool = SEED_POOLS[subject];
  const label = SUBJECT_LABELS[subject] || subject;

  let examples = "";
  if (pool?.length > 0) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, 10);
    examples = `Examples:\n${sample.map((e) => `- ${e}`).join("\n")}\n`;
  }

  const prompt = `You create episode hooks for documentary channel about ${label} encounters.

**Use EXACT TERM "${label}" in every topic.**

${examples}

Generate ${env.TOPIC_GENERATE_COUNT} distinct ${label} encounter hooks.
Rules:
- Use EXACT TERM "${label}" in every topic
- One sentence each, high-stakes direct encounter
- Vary roles, actions, outcomes
- No clickbait, questions, hashtags, quotes

Exclude already-used:
${usedList.length ? usedList.map((t) => `- ${t}`).join("\n") : "(none)"}

Return STRICT JSON: { "topics": ["...", "..."] }`;

  const completion = await openai.chat.completions.create({
    model,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Return STRICT JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const parsed = coerceLastJsonBlock(completion.choices[0].message?.content || "{}");
  return Array.isArray(parsed?.topics) ? parsed.topics.filter(Boolean) : [];
}

function fallbackGenerate(subject: string, n: number, exclude: Set<string>): string[] {
  const pool = SEED_POOLS[subject];
  if (!pool?.length) {
    return [`${SUBJECT_LABELS[subject] || subject} encounter reported by witnesses`];
  }

  const available = pool.filter((s) => !exclude.has(s.toLowerCase()));
  const shuffled = [...(available.length ? available : pool)].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function registerTopicRoutes(app: FastifyInstance) {
  app.get("/topics/next", async (req: FastifyRequest<{ Querystring: { subject?: string } }>, reply) => {
    const subject = canonicalSubject(req.query?.subject);
    const key = `subject:${slugify(subject)}`;

    const used = await readUsed();
    const usedList = used[key] || [];
    const usedSet = new Set(usedList.map((s) => s.toLowerCase()));

    let topics: string[] = [];
    try {
      topics = await generateTopics(subject, usedList);
    } catch (err) {
      console.error("Topic generation failed:", err);
      topics = fallbackGenerate(subject, env.TOPIC_GENERATE_COUNT, usedSet);
    }

    const candidate = topics.find((t) => !usedSet.has(String(t).toLowerCase())) || topics[0] || fallbackGenerate(subject, 1, new Set())[0];

    const nextUsed = [candidate, ...usedList].slice(0, env.TOPIC_HISTORY_LIMIT);
    used[key] = nextUsed;
    await writeUsed(used);

    return reply.send({ subject, topic: candidate, candidates: topics });
  });

  app.delete("/topics/reset", async (req: FastifyRequest<{ Querystring: { subject?: string } }>, reply) => {
    const subject = canonicalSubject(req.query?.subject);
    const key = `subject:${slugify(subject)}`;
    const used = await readUsed();
    delete used[key];
    await writeUsed(used);
    return reply.send({ ok: true, subject });
  });
}