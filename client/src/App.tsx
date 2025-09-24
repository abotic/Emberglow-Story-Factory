import { useEffect, useMemo, useState } from "react";
import { createJob, streamJob, listJobs, type GenerateJobPayload } from "./lib/api";
import { HISTORY_TOPICS, STORY_TYPES } from "./constants/storyOptions";
import { Select } from "./components/Select";
import { JobPanel } from "./components/JobPanel";
import { SavedBrowser } from "./components/SavedBrowser";
import { RunningJobs } from "./components/RunningJobs";

type StoryValue = (typeof STORY_TYPES)[number]["value"];

export default function App() {
  const [storyType, setStoryType] = useState<StoryValue>("history_learning");
  const [historyTopic, setHistoryTopic] = useState<string>(HISTORY_TOPICS[0]);
  const [minutes, setMinutes] = useState<number>(60);
  const [jobState, setJobState] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [refreshSeq, setRefreshSeq] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [maxConcurrency, setMaxConcurrency] = useState<number>(4);

  const showHistory = storyType === "history_learning";
  useEffect(() => {
    if (!showHistory) setHistoryTopic("");
  }, [showHistory]);

  const updateCapacity = async () => {
    try {
      const out = await listJobs();
      const active = (out.jobs || []).filter((j) =>
        ["queued", "running", "saving"].includes(j.status)
      ).length;
      setActiveCount(active);
      setMaxConcurrency(out.maxConcurrency ?? 4);
    } catch {}
  };

  useEffect(() => {
    updateCapacity();
    const t = setInterval(updateCapacity, 5000);
    return () => clearInterval(t);
  }, []);

  const handleGenerate = async () => {
    setSubmitting(true);
    setJobState({ status: "queued", progress: 0, message: "Queued" });

    const payload: GenerateJobPayload = {
      story_type: storyType,
      target_minutes: Number(minutes),
      history_topic: showHistory ? historyTopic : undefined,
    };

    const { id } = await createJob(payload);
    await updateCapacity();
    setSubmitting(false);

    let closeFn = () => {};
    closeFn = streamJob(id, async (s) => {
      setJobState(s);
      if (s.status === "done" || s.status === "error" || s.status === "canceled") {
        closeFn();
        setRefreshSeq((x) => x + 1);
        await updateCapacity();
      }
    });
  };

  const titleHint = useMemo(() => {
    switch (storyType) {
      case "romance":
        return "Warm, hopeful, character-first";
      case "horror":
        return "Creeping dread, psychological turns";
      case "adventure":
        return "Exploration and stakes";
      case "history_learning":
        return "Specific era, day-in-life angle";
      default:
        return "Long-form stories with strong arcs";
    }
  }, [storyType]);

  const capacityFull = activeCount >= maxConcurrency;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-white to-amber-50">
      <header className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md" />
          <h1 className="text-4xl font-extrabold tracking-tight">
            EmberGlow <span className="text-amber-600">Story Factory</span>
          </h1>
        </div>
        <p className="text-gray-600 mt-2">Craft immersive long-form stories on demand.</p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border bg-white/80 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">New story</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Select
                  label="Story type"
                  value={storyType}
                  onChange={(v) => setStoryType(v as StoryValue)}
                  options={STORY_TYPES as any}
                />
              </div>
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
              <div className="hidden md:block">
                <div className="text-xs text-gray-500 pt-6">{titleHint}</div>
              </div>
            </div>

            {showHistory && (
              <div className="mt-4">
                <Select
                  label="History topic (100+ curated)"
                  value={historyTopic}
                  onChange={setHistoryTopic}
                  options={HISTORY_TOPICS.map((h) => ({ value: h, label: h }))}
                />
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={submitting || capacityFull}
                className="px-5 py-3 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {capacityFull
                  ? `All ${maxConcurrency} slots busy…`
                  : submitting
                  ? "Submitting…"
                  : "Generate"}
              </button>
              <span className="text-xs text-gray-500">
                {activeCount}/{maxConcurrency} in progress
              </span>
            </div>

            <div className="mt-6">
              <JobPanel state={jobState} />
            </div>
          </div>

          <RunningJobs onChanged={() => setRefreshSeq((x) => x + 1)} />

          <SavedBrowser refreshToken={refreshSeq} />
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border bg-white/80 shadow-sm p-6">
            <h3 className="font-semibold mb-2">Tips</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>You can run up to {maxConcurrency} stories in parallel.</li>
              <li>Set a target time; the generator will match it closely.</li>
              <li>History topics are highly specific for strong episodes.</li>
              <li>Each project section includes a one-click copy button.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
