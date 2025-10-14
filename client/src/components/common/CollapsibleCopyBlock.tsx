import { useState } from "react";

type Props = {
  label: string;
  value: unknown;
  defaultOpen?: boolean;
};

export function CollapsibleCopyBlock({ label, value, defaultOpen = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleCopy = async () => {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    await navigator.clipboard.writeText(text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold hover:text-amber-600 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {label}
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1 rounded-lg border hover:bg-gray-100 text-xs"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {isOpen && (
        <pre className="p-3 rounded-xl bg-gray-50 whitespace-pre-wrap break-words text-xs overflow-x-auto">
          {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}