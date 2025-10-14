import { CopyBlock } from "../common/CopyBlock";
import { formatNumber } from "../../lib/utils";
import type { ProjectDetails as ProjectDetailsType } from "../../types";
import { CollapsibleCopyBlock } from "../common/CollapsibleCopyBlock";

type Props = {
  details: ProjectDetailsType;
  category: string;
  onDelete: () => void;
};

function getHookForType(type: string): string {
  const hooks: Record<string, string> = {
    romance: "(a tender second-chance love story)",
    horror: "(a descent into the uncanny)",
    adventure: "(a perilous journey beyond the map)",
    history_learning: "(a vivid immersion in the past)",
    mystery: "(a case where every clue cuts both ways)",
    sci_fi: "(you won't believe what they found)",
    fantasy: "(a realm where oaths bind magic)",
    sleep: "(gentle narration to drift away)",
    dystopia: "(tomorrow's warning, told today)",
    chronicle: "(an epic chronicle across generations)",
    paranormal: "(encounters beyond explanation)",
    alt_history: "(what if one choice changed it all?)",
    folklore: "(old embers, new fire)",
    cozy_mystery: "(tea, whispers, and a clever twist)",
    space_opera: "(stars at war, hearts at stake)",
    philosophy: "(a parable that lingers)",
    survival: "(when resolve is all you have)",
  };
  return hooks[type] || "(a story that stays with you)";
}

export function ProjectDetails({ details, category, onDelete }: Props) {
  const expandedTitle = details.expanded_title || `${details.title} ${getHookForType(category)}`;

  return (
    <div className="mt-2 mb-3 p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-white border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Details</h4>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {details?.meta?.target_minutes && <span>{details.meta.target_minutes} min</span>}
          {details?.meta?.estimated_word_count && (
            <span>· {formatNumber(details.meta.estimated_word_count)} words</span>
          )}
          <button
            onClick={onDelete}
            className="px-2 py-1 border rounded-lg hover:bg-gray-50 text-xs"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <CopyBlock label="Expanded title" value={expandedTitle} />
        <CopyBlock label="Title" value={details.title} />
        <CopyBlock label="Description" value={details.description} />
        <CopyBlock label="Hashtags" value={(details.hashtags || []).join(" ")} />
        <CopyBlock label="Thumbnail prompt" value={details.thumbnail_prompt} />
        <CopyBlock label="Hero video prompt" value={details.hero_video_prompt} />
        <CollapsibleCopyBlock label="Scene prompts" value={details.scene_prompts} />
        <CollapsibleCopyBlock label="Full script" value={details.script} />
      </div>
    </div>
  );
}