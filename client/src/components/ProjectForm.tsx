import { useState } from "react";
import type { GenerateJobPayload } from "../lib/api";

type Props = { onSubmit: (p: GenerateJobPayload) => void };

export function ProjectForm({ onSubmit }: Props) {
  const [form, setForm] = useState<GenerateJobPayload>({
    story_type: "sleep",
    target_minutes: 60,
    history_topic: "",
  });

  const update = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value } as GenerateJobPayload));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, target_minutes: Number(form.target_minutes) });
      }}
      className="grid gap-3"
    >
      <input
        name="history_topic"
        value={form.history_topic || ""}
        onChange={update}
        placeholder="Optional history topic"
        className="border p-2 rounded-lg"
      />
      <label className="text-sm text-gray-600">Target minutes</label>
      <input
        type="number"
        name="target_minutes"
        value={form.target_minutes}
        onChange={update}
        min={5}
        max={240}
        className="border p-2 rounded-lg"
      />
      <button className="mt-2 px-4 py-2 rounded-xl bg-black text-white">Generate</button>
    </form>
  );
}
