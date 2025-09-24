import type { JobStatus } from "../lib/api";

type Props = {
  state: { status: JobStatus; progress: number; message: string } | null;
};

export function JobPanel({ state }: Props) {
  if (!state) return null;
  const { status, progress, message } = state;
  const badge =
    status === "done"
      ? "bg-emerald-600"
      : status === "error"
      ? "bg-rose-600"
      : status === "canceled"
      ? "bg-gray-500"
      : "bg-amber-600";
  return (
    <div className="rounded-3xl border p-5 bg-white/80 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`inline-flex text-white text-xs px-2 py-1 rounded-full ${badge}`}>
          {status.toUpperCase()}
        </span>
        <span className="text-sm text-gray-700">{message}</span>
      </div>
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-amber-600 transition-all" style={{ width: `${progress || 0}%` }} />
      </div>
    </div>
  );
}
