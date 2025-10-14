import { useEffect, useState } from "react";
import { createJob, createIngestJob, streamJob, listJobs } from "./lib/api";
import { GenerateForm } from "./components/forms/GenerateForm";
import { IngestForm } from "./components/forms/IngestForm";
import { JobPanel } from "./components/job/JobPanel";
import { RunningJobs } from "./components/job/RunningJobs";
import { ProjectBrowser } from "./components/project/ProjectBrowser";
import type { GenerateJobPayload, IngestJobPayload } from "./types";

type Mode = "generate" | "ingest";

export default function App() {
  const [mode, setMode] = useState<Mode>("generate");
  const [jobState, setJobState] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [refreshSeq, setRefreshSeq] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [maxConcurrency, setMaxConcurrency] = useState<number>(4);

  const updateCapacity = async () => {
    try {
      const out = await listJobs();
      const active = out.jobs.filter((j) =>
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

  const handleGenerate = async (payload: GenerateJobPayload) => {
    setSubmitting(true);
    setJobState({ status: "queued", progress: 0, message: "Queued" });

    try {
      const { id } = await createJob(payload);
      await updateCapacity();

      let closeFn = () => {};
      closeFn = streamJob(id, async (s) => {
        setJobState(s);
        if (["done", "error", "canceled"].includes(s.status)) {
          closeFn();
          setRefreshSeq((x) => x + 1);
          await updateCapacity();
        }
      });
    } catch (err) {
      console.error("Failed to start generation:", err);
      setJobState({
        status: "error",
        progress: 100,
        message: "Failed to start job",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIngest = async (payload: IngestJobPayload) => {
    setSubmitting(true);
    setJobState({ status: "queued", progress: 0, message: "Queued" });

    try {
      const { id } = await createIngestJob(payload);
      await updateCapacity();

      let closeFn = () => {};
      closeFn = streamJob(id, async (s) => {
        setJobState(s);
        if (["done", "error", "canceled"].includes(s.status)) {
          closeFn();
          setRefreshSeq((x) => x + 1);
          await updateCapacity();
        }
      });
    } catch (err) {
      console.error("Failed to start ingest:", err);
      setJobState({
        status: "error",
        progress: 100,
        message: "Failed to start job",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
        <p className="text-gray-600 mt-2">
          Create long-form stories on demand — or ingest your own.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border bg-white/80 shadow-sm p-2 flex gap-2">
            <button
              onClick={() => setMode("generate")}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                mode === "generate" ? "bg-amber-600 text-white" : "hover:bg-gray-50"
              }`}
            >
              New story
            </button>
            <button
              onClick={() => setMode("ingest")}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                mode === "ingest" ? "bg-amber-600 text-white" : "hover:bg-gray-50"
              }`}
            >
              Use existing script
            </button>
          </div>

          {mode === "generate" ? (
            <GenerateForm
              onSubmit={handleGenerate}
              submitting={submitting}
              disabled={capacityFull}
            />
          ) : (
            <IngestForm
              onSubmit={handleIngest}
              submitting={submitting}
              disabled={capacityFull}
            />
          )}

          <JobPanel state={jobState} />
          <RunningJobs onChanged={() => setRefreshSeq((x) => x + 1)} />
          <ProjectBrowser refreshToken={refreshSeq} />
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border bg-white/80 shadow-sm p-6">
            <h3 className="font-semibold mb-3">Tips</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li>Run up to {maxConcurrency} stories in parallel</li>
              <li>Ingest mode auto-estimates runtime from word count</li>
              <li>All outputs appear in Projects with copy buttons</li>
              <li>
                {activeCount}/{maxConcurrency} slots currently in use
              </li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}