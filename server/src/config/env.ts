import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_TEMPERATURE: z.coerce.number().default(1),
  PORT: z.coerce.number().default(8000),
  READING_RATE_WPM: z.coerce.number().default(150),
  MAX_APPEND_PASSES: z.coerce.number().default(3),
  UNDERFLOW_TOLERANCE: z.coerce.number().default(0.02),
  JOB_STREAM_INTERVAL_MS: z.coerce.number().default(3000),
  MAX_CONCURRENCY: z.coerce.number().default(6),
  MAX_SCENE_STAMPS_PER_PASS: z.coerce.number().default(120),
  SCENE_SCRIPT_OVERLAP_CHARS: z.coerce.number().default(1200),
  TITLE_VARIANT_COUNT: z.coerce.number().default(8),
  PACKAGING_TITLE_MAX_LEN: z.coerce.number().default(70),
  TOPIC_HISTORY_LIMIT: z.coerce.number().default(200),
  TOPIC_GENERATE_COUNT: z.coerce.number().default(12),
});

export const env = EnvSchema.parse(process.env);