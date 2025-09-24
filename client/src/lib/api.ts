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

export type ProjectsTree = Record<
  string,
  {
    name: string;
    items: { file: string; title: string; savedAt: number; minutes?: number; words?: number }[];
  }
>;

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export async function createJob(payload: GenerateJobPayload): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getJob(id: string): Promise<JobListItem> {
  const res = await fetch(`${BASE}/jobs/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listJobs(): Promise<JobsOverview> {
  const res = await fetch(`${BASE}/jobs`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteJob(id: string): Promise<{ ok: true }> {
  const res = await fetch(`${BASE}/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function streamJob(id: string, onEvent: (state: JobListItem) => void): () => void {
  let closed = false;
  let pollTimer: number | null = null;

  const startPolling = () => {
    if (pollTimer) return;
    onEvent({ id, status: "running", progress: 15, message: "Preparing…", createdAt: Date.now(), updatedAt: Date.now() });
    pollTimer = window.setInterval(async () => {
      try {
        const s = await getJob(id);
        onEvent(s);
        if (s.status === "done" || s.status === "error" || s.status === "canceled") {
          if (pollTimer) window.clearInterval(pollTimer);
          pollTimer = null;
        }
      } catch {}
    }, 5000);
  };

  let es: EventSource | null = null;
  try {
    es = new EventSource(`${BASE}/jobs/${id}/stream`);
    es.onmessage = (evt) => {
      try {
        const state = JSON.parse(evt.data) as JobListItem;
        onEvent(state);
        if (state.status === "done" || state.status === "error" || state.status === "canceled") {
          es?.close();
          if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
          }
        }
      } catch {}
    };
    es.onerror = () => {
      es?.close();
      if (!closed) startPolling();
    };
  } catch {
    startPolling();
  }

  return () => {
    closed = true;
    es?.close();
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

export async function listProjectsTree(): Promise<{ tree: ProjectsTree }> {
  const res = await fetch(`${BASE}/projects`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function loadProject(category: string, file: string): Promise<any> {
  const res = await fetch(
    `${BASE}/project?category=${encodeURIComponent(category)}&file=${encodeURIComponent(file)}`
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProject(category: string, file: string): Promise<{ ok: true }> {
  const res = await fetch(
    `${BASE}/project?category=${encodeURIComponent(category)}&file=${encodeURIComponent(file)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
