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
});
export type GenerateJobRequest = z.infer<typeof GenerateJobRequestSchema>;

export const SceneItemSchema = z.object({
  t: z.string().optional(),
  prompt: z.string(),
});

export const GenerateResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  hashtags: z.array(z.string()),
  thumbnail_prompt: z.string(),
  hero_video_prompt: z.string(),
  scene_prompts: z.array(SceneItemSchema),
  script: z.string(),
  meta: z.record(z.any()),
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
