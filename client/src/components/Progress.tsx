type Props = { value: number; label?: string };

export function Progress({ value, label }: Props) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700">{label || "Processing…"}</span>
        <span className="text-sm text-gray-500">{pct}%</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-black transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
