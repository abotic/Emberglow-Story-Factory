import { useEffect, useMemo, useState } from "react";
import { Select } from "../common/Select";
import { STORY_TYPES, HISTORY_TOPICS, CRYPTID_SUBJECTS, CRYPTIC_TYPES } from "../../lib/constants";
import { labelForCryptid } from "../../lib/utils";
import { getNextTopic } from "../../lib/api";
import type { GenerateJobPayload } from "../../types";

type StoryValue = (typeof STORY_TYPES)[number]["value"];

type Props = {
  onSubmit: (payload: GenerateJobPayload) => void;
  submitting: boolean;
  disabled: boolean;
};

export function GenerateForm({ onSubmit, submitting, disabled }: Props) {
  const [storyType, setStoryType] = useState<StoryValue>("history_learning");
  const [historyTopic, setHistoryTopic] = useState<string>(HISTORY_TOPICS[0]);
  const [minutes, setMinutes] = useState<number>(25);
  const [narrationMode, setNarrationMode] = useState<GenerateJobPayload["narration_mode"]>("first_person_survival");
  const [cryptid, setCryptid] = useState<string>("bigfoot");
  const [seedTopic, setSeedTopic] = useState<string>("");
  const [seedLoading, setSeedLoading] = useState<boolean>(false);

  const showHistory = storyType === "history_learning";
  const showCrypticSeed = CRYPTIC_TYPES.has(storyType);

  useEffect(() => {
    if (!showHistory) setHistoryTopic("");
    if (["survival", "horror", "paranormal"].includes(storyType)) {
      setNarrationMode("first_person_survival");
    } else if (storyType === "mystery") {
      setNarrationMode("investigative_casefile");
    } else {
      setNarrationMode("documentary_flat");
    }
    if (!showCrypticSeed) {
      setCryptid("bigfoot");
      setSeedTopic("");
    }
  }, [storyType, showHistory, showCrypticSeed]);

  const handleSubmit = () => {
    let finalSeed = seedTopic.trim();
    if (showCrypticSeed && finalSeed) {
      const subjectLabel = labelForCryptid(cryptid);
      finalSeed = `${subjectLabel} — ${finalSeed}`;
    }

    const payload: GenerateJobPayload = {
      story_type: storyType,
      target_minutes: minutes,
      history_topic: showHistory ? historyTopic : undefined,
      packaging_style: "viral_honest",
      narration_mode: narrationMode,
      seed_topic: showCrypticSeed ? finalSeed : undefined,
    };
    onSubmit(payload);
  };

  const surpriseMe = async () => {
    setSeedLoading(true);
    try {
      const result = await getNextTopic(cryptid);
      setSeedTopic(result.topic || "");
    } catch (err) {
      console.error("Failed to get topic:", err);
    } finally {
      setSeedLoading(false);
    }
  };

  const seedPlaceholder = useMemo(() => {
    const label = labelForCryptid(cryptid);
    return `e.g., "${label} encounter at dawn" — or click Surprise me`;
  }, [cryptid]);

  return (
    <div className="rounded-3xl border bg-white/80 shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">New story</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <Select
          label="Story type"
          value={storyType}
          onChange={(v) => setStoryType(v as StoryValue)}
          options={STORY_TYPES as any}
        />

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Target minutes (≥ 5)</span>
          <input
            type="number"
            min={5}
            max={240}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="border rounded-2xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </label>
      </div>

      {showHistory && (
        <div className="mt-4">
          <Select
            label="History topic"
            value={historyTopic}
            onChange={setHistoryTopic}
            options={HISTORY_TOPICS.map((h) => ({ value: h, label: h }))}
          />
        </div>
      )}

      {showCrypticSeed && (
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <Select
            label="Cryptid subject"
            value={cryptid}
            onChange={setCryptid}
            options={CRYPTID_SUBJECTS}
          />

          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Topic seed (optional)</span>
            <input
              type="text"
              value={seedTopic}
              onChange={(e) => setSeedTopic(e.target.value)}
              placeholder={seedPlaceholder}
              className="border rounded-2xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </label>

          <div className="grid">
            <span className="text-sm text-transparent">.</span>
            <button
              type="button"
              onClick={surpriseMe}
              disabled={seedLoading}
              className="px-4 py-2 rounded-2xl border hover:bg-gray-50 disabled:opacity-50"
            >
              {seedLoading ? "Picking…" : "Surprise me"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting || disabled}
          className="px-5 py-3 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {disabled ? "Queue full…" : submitting ? "Submitting…" : "Generate"}
        </button>
      </div>
    </div>
  );
}