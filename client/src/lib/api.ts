import type { GenerateJobPayload, IngestJobPayload, JobListItem, JobsOverview, ProjectsTree, ProjectDetails } from "../types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createJob(payload: GenerateJobPayload): Promise<{ id: string }> {
  return request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createIngestJob(payload: IngestJobPayload): Promise<{ id: string }> {
  return request("/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getJob(id: string): Promise<JobListItem> {
  return request(`/jobs/${id}`);
}

export async function listJobs(): Promise<JobsOverview> {
  return request("/jobs");
}

export async function deleteJob(id: string): Promise<{ ok: true }> {
  return request(`/jobs/${id}`, { method: "DELETE" });
}

export function streamJob(id: string, onEvent: (state: JobListItem) => void): () => void {
  let closed = false;
  let pollTimer: number | null = null;

  const startPolling = () => {
    if (pollTimer) return;
    pollTimer = window.setInterval(async () => {
      try {
        const s = await getJob(id);
        onEvent(s);
        if (["done", "error", "canceled"].includes(s.status)) {
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
        if (["done", "error", "canceled"].includes(state.status)) {
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
  return request("/projects");
}

export async function loadProject(category: string, file: string): Promise<ProjectDetails> {
  const params = new URLSearchParams({ category, file });
  return request(`/project?${params}`);
}

export async function deleteProject(category: string, file: string): Promise<{ ok: true }> {
  const params = new URLSearchParams({ category, file });
  return request(`/project?${params}`, { method: "DELETE" });
}

export async function getNextTopic(subject: string): Promise<{ topic?: string }> {
  const params = new URLSearchParams({ subject });
  const data = await request<{ topic: string }>(`/topics/next?${params}`);
  return { topic: data.topic };
}