import { useState } from "react";

type Props = { label: string; value: unknown };

export function CopyBlock({ label, value }: Props) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    await navigator.clipboard.writeText(text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{label}</h3>
        <button
          onClick={onCopy}
          className="px-3 py-1 rounded-lg border hover:bg-gray-100 text-sm"
          aria-label={`Copy ${label}`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 p-3 rounded-xl bg-gray-50 whitespace-pre-wrap break-words text-sm">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
