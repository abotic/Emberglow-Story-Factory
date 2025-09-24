import { useEffect, useState } from "react";
import { listJobs, deleteJob, type JobListItem } from "../lib/api";

function cap(s?: string) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

type Props = { onChanged?: () => void };

export function RunningJobs({ onChanged }: Props) {
  const [jobs, setJobs] = useState<JobListItem[]>([]);

  const refresh = async () => {
    const out = await listJobs();
    const active = (out.jobs || []).filter((j) =>
      ["queued", "running", "saving"].includes(j.status)
    );
    setJobs(active);
    if (active.length === 0 && onChanged) onChanged();
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  const cancel = async (id: string) => {
    await deleteJob(id);
    await refresh();
  };

  if (jobs.length === 0) return null;

  return (
    <div className="rounded-3xl border bg-white/80 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Currently generating</h3>
        <button onClick={refresh} className="text-sm px-3 py-1 border rounded-xl hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {jobs.map((j) => {
          const type = cap(j.story_type) || "Story";
          const minutes =
            typeof j.target_minutes === "number" ? `${j.target_minutes} min` : "";
          const queuedBadge =
            j.status === "queued" && typeof j.queue_index === "number"
              ? ` · queued #${j.queue_index + 1}`
              : "";

          return (
            <div
              key={j.id}
              className="rounded-2xl border px-4 py-3 bg-white flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {type} {minutes && `· ${minutes}`}
                    {queuedBadge}
                  </div>
                  {j.history_topic ? (
                    <div className="text-xs text-gray-500 truncate" title={j.history_topic}>
                      Topic: {j.history_topic}
                    </div>
                  ) : null}
                  <div className="text-xs text-gray-500">{j.message}</div>
                  <div className="text-[10px] text-gray-400">ID: {j.id}</div>
                </div>
                <button
                  onClick={() => cancel(j.id)}
                  className="text-sm px-3 py-1 border rounded-xl hover:bg-gray-50 shrink-0"
                >
                  Cancel
                </button>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all"
                  style={{ width: `${j.progress || 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        You can queue multiple stories; up to your concurrency limit will run in parallel.
      </p>
    </div>
  );
}
