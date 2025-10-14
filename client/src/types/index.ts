export type StoryType =
  | "romance"
  | "horror"
  | "adventure"
  | "history_learning"
  | "mystery"
  | "sci_fi"
  | "fantasy"
  | "sleep"
  | "dystopia"
  | "chronicle"
  | "paranormal"
  | "alt_history"
  | "folklore"
  | "cozy_mystery"
  | "space_opera"
  | "philosophy"
  | "survival";

export type JobStatus = "queued" | "running" | "saving" | "done" | "error" | "canceled";

export type GenerateJobPayload = {
  story_type: StoryType;
  target_minutes: number;
  history_topic?: string;
  packaging_style?: "viral_honest" | "neutral";
  narration_mode?: "investigative_casefile" | "documentary_flat" | "first_person_survival";
  seed_topic?: string;
};

export type IngestJobPayload = {
  story_type: StoryType;
  script: string;
  target_minutes?: number;
  packaging_style?: "viral_honest" | "neutral";
  narration_mode?: "investigative_casefile" | "documentary_flat" | "first_person_survival";
  seed_topic?: string;
};

export type JobListItem = {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  resultPath?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  story_type?: StoryType;
  target_minutes?: number;
  history_topic?: string;
  queue_index?: number;
};

export type JobsOverview = {
  jobs: JobListItem[];
  running: number;
  queued: number;
  maxConcurrency: number;
};

export type ProjectItem = {
  file: string;
  title: string;
  savedAt: number;
  minutes?: number;
  words?: number;
};

export type ProjectCategory = {
  name: string;
  items: ProjectItem[];
};

export type ProjectsTree = Record<string, ProjectCategory>;

export type ProjectDetails = {
  title: string;
  expanded_title?: string;
  description: string;
  hashtags: string[];
  thumbnail_prompt: string;
  hero_video_prompt: string;
  scene_prompts: any[];
  script: string;
  meta?: {
    target_minutes?: number;
    estimated_word_count?: number;
  };
};