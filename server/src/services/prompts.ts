import type { GenerateJobRequest, StoryPremise } from "../types.js";

export function buildInitialPrompt(params: { topic: string; target_minutes: number }) {
  return `You are a master storyteller creating deep, emotional narratives where paranormal elements catalyze character transformation.

Interpret the SEED IDEA and escalate it into a profound, life-changing encounter. If passive, make it direct and dramatic.

SEED IDEA: "${params.topic}"

Create a full story premise with clear protagonist, deep motivation, dramatic central event, and emotional arc.

Return STRICT JSON:
{
  "story_premise": {
    "hook": "Short, punchy, first-person ALL CAPS quote. e.g., 'IT SAVED ME'",
    "protagonist": "Detailed character with emotional state",
    "protagonist_motivation": "Deep internal reason for being there",
    "action": "Core dramatic event challenging beliefs",
    "narrative_arc": "Emotional transformation from beginning to end"
  },
  "description": "2–3 engaging paragraphs for YouTube. Focus on emotional journey. No spoilers.",
  "hashtags": ["#paranormal", "#mystery"],
  "thumbnail_prompt": "Cinematic, photorealistic one-frame poster. Focus on emotion. High contrast. No text.",
  "hero_video_prompt": "5–8s video prompt. Establish mood and setting."
}`;
}

export function buildTitleVariantsPrompt(args: { story_premise: StoryPremise; count: number; maxLen: number }) {
  const { hook, protagonist, action } = args.story_premise;
  return `You are a viral YouTube title expert.
Create ${args.count} title variants based on the ESCALATED ACTION.

STORY PREMISE:
- Hook: "${hook}"
- Protagonist: "${protagonist}"
- Action: "${action}"

Format: 'HOOK IN ALL CAPS' - Descriptive Sentence - Keyword Suffix

Examples:
- 'BIGFOOT SAVED ME' - Old Man Guided Through Blizzard - Bigfoot Story
- 'IT STALKED MY CABIN' - Homesteader Terrorized by Vengeful Bigfoot - Bigfoot Encounter

Rules:
1. Hook in single quotes, ALL CAPS
2. Descriptive sentence summarizes escalated action
3. Keyword suffix like "Bigfoot Story", "UFO Encounter"
4. For Bigfoot use "Bigfoot" not "Sasquatch"
5. For Loch Ness use "Loch Ness" not "Nessie"
6. For UFO use "UFO" or "NLO" not "Alien"
7. Under ${args.maxLen} characters

Return STRICT JSON: { "titles": ["...", "..."] }`;
}

export function buildTitleRankerPrompt(args: { topic: string; maxLen: number }) {
  return `Rank these titles from best to worst for CTR for: ${args.topic}
Criteria: Format(50), Curiosity(30), Impact(20).
Return STRICT JSON: { "ranked": [{"title":"...","score":0-100,"why":"short reason"}] }`;
}

export function buildOutlinePrompt(story_premise: StoryPremise, totalWords: number, story_type: string) {
  const isHistory = story_type === "history_learning";
  const isCharacterDriven = ["paranormal", "horror", "survival"].includes(story_type);

  let instruction = "Follow classic 3-act structure (Setup, Confrontation, Resolution).";
  if (isHistory) {
    instruction = "Write documentary outline with clear golden thread. Each chapter flows like narrated segment with momentum.";
  } else if (isCharacterDriven) {
    instruction = `Build around character journey. Setup establishes motivation: '${story_premise.protagonist_motivation}'. Confrontation challenges protagonist. Resolution shows transformation: '${story_premise.narrative_arc}'.`;
  }

  return `You are a master showrunner. Create detailed chapter outline for ~${totalWords} words.
STORY PREMISE: ${JSON.stringify(story_premise, null, 2)}

INSTRUCTIONS:
1. Divide into 5–15 chapters
2. Each chapter: "title", flowing narrative "summary"
3. Assign "estimated_words" per chapter (sum = ${totalWords})
4. ${instruction}

Return STRICT JSON: { "outline": [ { "chapter": 1, "title": "...", "summary": "...", "estimated_words": 1500 } ] }`;
}

export function buildChapterPrompt(
  story_premise: StoryPremise,
  totalWords: number,
  outline: any[],
  currentChapterIndex: number,
  previousScript: string,
  narration_mode: GenerateJobRequest["narration_mode"]
) {
  const currentChapter = outline[currentChapterIndex];
  const isFirstChapter = currentChapterIndex === 0;

  const modes = {
    first_person_survival: {
      opening: isFirstChapter ? "Begin with vivid first-person hook." : "Continue first-person narrative.",
      style: "Write in gripping first-person ('I saw', 'I felt'), emphasizing sensory details and tension.",
    },
    investigative_casefile: {
      opening: isFirstChapter ? "Open with crisp factual hook." : "Continue objective analytical tone.",
      style: "Write in detailed investigative tone, like case study.",
    },
    documentary_flat: {
      opening: isFirstChapter ? "Begin with clean, direct hook." : "Continue objective narrative.",
      style: "Maintain consistent objective documentary tone.",
    },
  };

  const mode = modes[narration_mode];

  return `You are a master novelist. Write Chapter ${currentChapter.chapter}: "${currentChapter.title}".

STORY PREMISE: ${JSON.stringify(story_premise, null, 2)}
OUTLINE: ${JSON.stringify(outline, null, 2)}
PREVIOUS SCRIPT (context):
---
${(previousScript || "").slice(-1000)}
---

CHAPTER TASK:
- Summary: "${currentChapter.summary}"
- Target: ~${currentChapter.estimated_words} words
- Reinforce protagonist motivation and emotional arc
- ${mode.opening}
- ${mode.style}

RULES:
- Concrete nouns, powerful verbs
- Fluid uninterrupted prose
- No meta commentary, timestamps, bullets, academic labels
- No "Chapter X" in prose
- No special markers like [[BEAT]]

Return STRICT JSON: { "script_chapter": "<full chapter prose>" }`;
}

export function buildSceneFixPrompt(stamps: string[], fullScript: string) {
  return `You are a cinematographer for Stable Diffusion 3.5. Convert narration into ultra-photorealistic cinematic prompts.

TIMESTAMPS: ${JSON.stringify(stamps)}
SCRIPT:
---
${fullScript}
---

INSTRUCTIONS:
1. Each timestamp: highly specific photorealistic prompt matching exact action/emotion/setting
2. Focus on stable compositions, light, shadow, texture
3. Contemporary photorealism
4. Optional negative_prompt: "blurry, extra fingers, deformed, text, low contrast, cartoon, painting"
5. Include "camera", "lighting", "ar":"16:9"
6. For recurring characters: "character_tags": ["hiker:green parka"]
7. No timestamp in prompt text; use "t" field

Return STRICT JSON: { "scene_prompts_full": [ { "t":"MM:SS", "prompt":"...", "negative_prompt":"...", "camera":"...", "lighting":"...", "ar":"16:9", "seed":12345, "character_tags":["..."] } ] }`;
}

export function squeezeScriptForMetadata(script: string, maxChars = 8000) {
  if (script.length <= maxChars) return { excerpt: script };
  const third = Math.floor(maxChars / 3);
  const head = script.slice(0, third);
  const midStart = Math.max(0, Math.floor(script.length / 2) - Math.floor(third / 2));
  const mid = script.slice(midStart, midStart + third);
  const tail = script.slice(-third);
  return { excerpt: `HEAD:\n${head}\n\nMIDDLE:\n${mid}\n\nTAIL:\n${tail}` };
}

export function buildIngestMetadataPrompt(params: { approx_minutes: number; total_words: number; excerpt: string }) {
  return `You are a YouTube SEO and packaging expert.
A complete script has been provided (excerpted). Create accurate packaging from script content.

FACTS:
- Duration: ~${params.approx_minutes} min
- Words: ${params.total_words}

EXCERPTS:
---
${params.excerpt}
---

Return STRICT JSON:
{
  "title": "Viral-honest title (48–62 chars). For Loch Ness use 'Loch Ness'. For UFO use 'UFO'/'NLO'.",
  "expanded_title": "Longer companion title.",
  "description": "2–3 engaging paragraphs.",
  "hashtags": ["#paranormal", "#mystery"],
  "thumbnail_prompt": "One-frame poster faithful to script. No text.",
  "hero_video_prompt": "5–8s video prompt for opening mood."
}`;
}