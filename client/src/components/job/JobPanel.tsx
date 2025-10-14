import type { JobStatus } from "../../types";

type Props = {
  state: { status: JobStatus; progress: number; message: string } | null;
};

export function JobPanel({ state }: Props) {
  if (!state) return null;

  const { status, progress, message } = state;
  const badge: Record<JobStatus, string> = {
    queued: "bg-amber-600",
    running: "bg-amber-600",
    saving: "bg-amber-600",
    done: "bg-emerald-600",
    error: "bg-rose-600",
    canceled: "bg-gray-500",
  };
  const badgeClass = badge[status];

  return (
    <div className="rounded-3xl border p-5 bg-white/80 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`inline-flex text-white text-xs px-2 py-1 rounded-full ${badgeClass}`}>
          {status.toUpperCase()}
        </span>
        <span className="text-sm text-gray-700">{message}</span>
      </div>
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 transition-all"
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  );
}