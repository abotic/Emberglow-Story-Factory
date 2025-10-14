import { useState } from "react";

type Props = {
  label: string;
  value: unknown;
};

export function CopyBlock({ label, value }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    await navigator.clipboard.writeText(text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 rounded-lg border hover:bg-gray-100 text-xs"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-3 rounded-xl bg-gray-50 whitespace-pre-wrap break-words text-xs overflow-x-auto">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}