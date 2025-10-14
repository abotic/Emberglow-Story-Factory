import { z } from "zod";

export const StoryTypeEnum = z.enum([
  "romance",
  "horror",
  "adventure",
  "history_learning",
  "mystery",
  "sci_fi",
  "fantasy",
  "sleep",
  "dystopia",
  "chronicle",
  "paranormal",
  "alt_history",
  "folklore",
  "cozy_mystery",
  "space_opera",
  "philosophy",
  "survival",
]);

export const GenerateJobRequestSchema = z.object({
  story_type: StoryTypeEnum,
  target_minutes: z.number().int().min(5).max(240),
  history_topic: z.string().optional().default(""),
  packaging_style: z.enum(["viral_honest", "neutral"]).optional().default("viral_honest"),
  narration_mode: z
    .enum(["investigative_casefile", "documentary_flat", "first_person_survival"])
    .optional()
    .default("investigative_casefile"),
  seed_topic: z.string().optional(),
});

export type GenerateJobRequest = z.infer<typeof GenerateJobRequestSchema>;

export const IngestJobRequestSchema = z.object({
  story_type: StoryTypeEnum,
  script: z.string().min(100),
  target_minutes: z.number().int().min(5).max(240).optional(),
  packaging_style: z.enum(["viral_honest", "neutral"]).optional().default("viral_honest"),
  narration_mode: z
    .enum(["investigative_casefile", "documentary_flat", "first_person_survival"])
    .optional()
    .default("investigative_casefile"),
  seed_topic: z.string().optional(),
});

export type IngestJobRequest = z.infer<typeof IngestJobRequestSchema>;

export const SceneItemSchema = z.object({
  t: z.string().optional(),
  prompt: z.string(),
  negative_prompt: z.string().optional(),
  camera: z.string().optional(),
  lighting: z.string().optional(),
  ar: z.string().optional(),
  seed: z.number().int().optional(),
  character_tags: z.array(z.string()).optional(),
});

export const GenerateResponseSchema = z.object({
  title: z.string(),
  expanded_title: z.string().optional(),
  description: z.string(),
  hashtags: z.array(z.string()),
  thumbnail_prompt: z.string(),
  hero_video_prompt: z.string(),
  scene_prompts: z.array(SceneItemSchema),
  script: z.string(),
  meta: z.record(z.any()),
  alt_titles: z.array(z.string()).optional(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export type JobStatus = "queued" | "running" | "saving" | "done" | "error" | "canceled";

export interface JobState {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  resultPath?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoryPremise {
  hook: string;
  protagonist: string;
  protagonist_motivation: string;
  action: string;
  narrative_arc: string;
}