import { formatNumber } from "../../lib/utils";
import type { ProjectItem } from "../../types";

type Props = {
  item: ProjectItem;
  isOpen: boolean;
  onClick: () => void;
};

export function ProjectCard({ item, isOpen, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border px-4 py-3 hover:bg-gray-50 transition-colors ${
        isOpen ? "bg-gray-50" : ""
      }`}
    >
      <div className="grid grid-cols-[1fr,auto] gap-3 items-start">
        <div className="min-w-0 overflow-hidden">
          <div 
            className="font-medium text-sm leading-snug overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
              overflowWrap: "break-word"
            }}
            title={item.title}
          >
            {item.title}
          </div>
          <div className="text-xs text-gray-500 truncate mt-1">{item.file}</div>
        </div>

        <div className="text-xs text-gray-500 text-right whitespace-nowrap">
          {item.minutes && <div>{item.minutes} min</div>}
          {item.words && <div>{formatNumber(item.words)} words</div>}
        </div>
      </div>
    </button>
  );
}