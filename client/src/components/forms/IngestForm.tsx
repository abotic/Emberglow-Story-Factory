import { useMemo, useState } from "react";
import { Select } from "../common/Select";
import { STORY_TYPES } from "../../lib/constants";
import type { IngestJobPayload } from "../../types";

type StoryValue = (typeof STORY_TYPES)[number]["value"];

type Props = {
  onSubmit: (payload: IngestJobPayload) => void;
  submitting: boolean;
  disabled: boolean;
};

export function IngestForm({ onSubmit, submitting, disabled }: Props) {
  const [storyType, setStoryType] = useState<StoryValue>("history_learning");
  const [minutesOverride, setMinutesOverride] = useState<string>("");
  const [script, setScript] = useState<string>("");

  const words = useMemo(() => (script.trim().match(/\S+/g) ?? []).length, [script]);
  const estMinutes = useMemo(() => Math.max(5, Math.min(240, Math.round(words / 150))), [words]);

  const canSubmit = script.trim().length >= 100 && !disabled && !submitting;

  const handleSubmit = () => {
    const payload: IngestJobPayload = {
      story_type: storyType,
      script,
      target_minutes: minutesOverride ? Number(minutesOverride) : undefined,
    };
    onSubmit(payload);
  };

  return (
    <div className="rounded-3xl border bg-white/80 shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Scenery from existing script</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <Select
          label="Story type"
          value={storyType}
          onChange={(v) => setStoryType(v as StoryValue)}
          options={STORY_TYPES as any}
        />

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Target minutes (optional)</span>
          <input
            type="number"
            min={5}
            max={240}
            value={minutesOverride}
            onChange={(e) => setMinutesOverride(e.target.value)}
            placeholder={`Auto: ~${estMinutes} min`}
            className="border rounded-2xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </label>
      </div>

      <label className="grid gap-2 mt-4">
        <span className="text-sm text-gray-700">Script</span>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={16}
          placeholder="Paste your full script here..."
          className="border rounded-2xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </label>

      <div className="mt-2 text-xs text-gray-500">
        {words.toLocaleString()} words · auto est {estMinutes} min @ ~150 wpm
      </div>

      <div className="mt-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-5 py-3 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Generate scenery"}
        </button>
      </div>
    </div>
  );
}