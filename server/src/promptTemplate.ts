export function defaultsForType(story_type: string) {
  switch (story_type) {
    case "romance":
      return { brand: "Amber Hush", channel: "Amber Hush: Slowburn", niche: "Cozy romance", voice: "warm mezzo" };
    case "horror":
      return { brand: "Nightforge", channel: "Nightforge: Dreadtales", niche: "Psychological horror", voice: "low baritone" };
    case "adventure":
      return { brand: "Pale Harbor", channel: "Pale Harbor: Far Horizons", niche: "Adventure epics", voice: "bright tenor" };
    case "history_learning":
      return { brand: "Still Meridian", channel: "Still Meridian: Timewalk", niche: "Historical deep dives", voice: "clear contralto" };
    case "mystery":
      return { brand: "Thorn & Vale", channel: "Thorn & Vale: Casefiles", niche: "Unsolved mysteries", voice: "cool alto" };
    case "sci_fi":
      return { brand: "Slow Orbit", channel: "Slow Orbit: Hypotheticals", niche: "Thought-experiment sci-fi", voice: "neutral tenor" };
    case "fantasy":
      return { brand: "Lumen & Laurel", channel: "Lumen & Laurel: Mythweave", niche: "High fantasy", voice: "theatrical mezzo" };
    case "sleep":
      return { brand: "Pale Harbor", channel: "Pale Harbor: Moonrest", niche: "Bedtime sleep stories", voice: "soft alto" };
    case "dystopia":
      return { brand: "Obsidian Chronicle", channel: "Obsidian Chronicle: Dispatch", niche: "Dystopian tech tales", voice: "clinical tenor" };
    case "alt_history":
      return { brand: "Shadow Loom", channel: "Shadow Loom: Timelines", niche: "Alternate history", voice: "authoritative baritone" };
    case "folklore":
      return { brand: "Myth & Hearth", channel: "Myth & Hearth: Fireside", niche: "Folklore & legends", voice: "textured storyteller" };
    case "cozy_mystery":
      return { brand: "Pale Harbor", channel: "Pale Harbor: Teacup Mysteries", niche: "Cozy mystery", voice: "light mezzo" };
    case "space_opera":
      return { brand: "Slow Orbit", channel: "Slow Orbit: Stellaris", niche: "Space opera", voice: "cinematic tenor" };
    case "philosophy":
      return { brand: "Quiet Ephemeris", channel: "Quiet Ephemeris: Mindscapes", niche: "Philosophy parables", voice: "curious mezzo" };
    case "survival":
      return { brand: "Black Lantern", channel: "Black Lantern: Endure", niche: "Survival retellings", voice: "engaged tenor" };
    default:
      return { brand: "Amber Hush", channel: "Amber Hush: Stories", niche: "Narrative", voice: "neutral-natural" };
  }
}

export function buildPrompt(params: {
  brand: string;
  channel: string;
  niche: string;
  topic: string;
  target_minutes: number;
  voice_style: string;
  language: string;
  scene_stamps: string[];
  reading_rate_wpm: number;
  required_word_count: number;
}) {
  const {
    brand,
    channel,
    niche,
    topic,
    target_minutes,
    voice_style,
    language,
    scene_stamps,
    reading_rate_wpm,
    required_word_count,
  } = params;

  return `
You are an elite narrative showrunner and YouTube SEO editor. Create a complete package for a LONG-FORM narrated video.

CONTEXT
- Brand: ${brand}
- Channel: ${channel}
- Niche: ${niche}
- Topic: ${topic}
- Target duration: ${target_minutes} minutes
- Voice style: ${voice_style}
- Language: ${language}
- Reading rate: ~${reading_rate_wpm} wpm
- REQUIRED WORD COUNT for "script": ${required_word_count} words (you MUST meet or slightly exceed this)

OUTPUT RULES (STRICT)
- Output STRICT JSON ONLY. No markdown, no comments, no code fences, no extra text.
- "script" must be >= ${required_word_count} words (aim +0–3%).
- Keep content 100% ORIGINAL.
- Align visual prompts to story beats; avoid any trademarked IP.

JSON SCHEMA (follow exactly)
{
  "title": string,
  "description": string,
  "hashtags": string[],
  "thumbnail_prompt": string,
  "hero_video_prompt": string,
  "scene_prompts": [
    { "t": "MM:SS", "prompt": "vivid visual description; setting; subjects; style; lighting; composition; framing; negative prompts if essential" }
  ],
  "script": string,
  "meta": {
    "brand": string,
    "channel": string,
    "niche": string,
    "target_minutes": number,
    "reading_rate_wpm": ${reading_rate_wpm},
    "estimated_word_count": number
  }
}

SCENE PROMPTS
- Use exactly these timestamps: ${JSON.stringify(scene_stamps)}

DESCRIPTION FORMAT
- 2–4 short paragraphs (what/why).
- 5 bullet highlights (concise).
- Chapters: clear labels every 8–15 minutes.
- Soft CTA + optional credit placeholder.

TITLE
- Sentence case only. No full caps. No clickbait.

WRITE NOW. Return strict JSON only.
`.trim();
}

export function buildAppendPrompt(currentWords: number, targetWords: number) {
  const missing = Math.max(0, targetWords - currentWords);
  return `
You previously generated a long-form narration. We need more words to hit the target.
Append CONTIGUOUS narration that continues seamlessly from the existing story (no summary, no restart, no headings).
Return STRICT JSON ONLY:
{ "script_append": "<the additional narration only>" }
Target additional length: ~${missing} words (ok to exceed by up to 3%).
`.trim();
}

export function buildSceneFixPrompt(stamps: string[]) {
  return `
You previously generated scene prompts. They must align 1:1 with these timestamps:
${JSON.stringify(stamps)}
Regenerate the FULL list to match exactly. Return STRICT JSON ONLY:
{ "scene_prompts_full": [ { "t": "MM:SS", "prompt": "..." }, ... ] }
`.trim();
}

export function buildSceneExtraPrompt(count: number) {
  return `
We need extra scenery descriptions to extend visual coverage by ~${count} beats.
Return STRICT JSON ONLY:
{ "extra_scenes": [ { "prompt": "vivid visual description; setting; subjects; style; lighting; composition" }, ... ] }
Do NOT include timestamps. Each prompt should be distinct and thematic.
`.trim();
}
