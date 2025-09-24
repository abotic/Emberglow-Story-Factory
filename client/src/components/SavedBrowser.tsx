import { useEffect, useMemo, useState } from "react";
import { listProjectsTree, loadProject, deleteProject, type ProjectsTree } from "../lib/api";
import { CopyBlock } from "./CopyBlock";

function hookForType(type: string) {
  switch (type) {
    case "romance":
      return "(a tender second-chance love story)";
    case "horror":
      return "(a descent into the uncanny)";
    case "adventure":
      return "(a perilous journey beyond the map)";
    case "history_learning":
      return "(a vivid immersion in the past)";
    case "mystery":
      return "(a case where every clue cuts both ways)";
    case "sci_fi":
      return "(you won’t believe what they found)";
    case "fantasy":
      return "(a realm where oaths bind magic)";
    case "sleep":
      return "(gentle narration to drift away)";
    case "dystopia":
      return "(tomorrow’s warning, told today)";
    case "alt_history":
      return "(what if one choice changed it all?)";
    case "folklore":
      return "(old embers, new fire)";
    case "cozy_mystery":
      return "(tea, whispers, and a clever twist)";
    case "space_opera":
      return "(stars at war, hearts at stake)";
    case "philosophy":
      return "(a parable that lingers)";
    case "survival":
      return "(when resolve is all you have)";
    default:
      return "(a story that stays with you)";
  }
}

type Props = { refreshToken: number };

export function SavedBrowser({ refreshToken }: Props) {
  const [tree, setTree] = useState<ProjectsTree>({});
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<{ category: string; file: string } | null>(null);
  const [details, setDetails] = useState<any | null>(null);

  const refresh = async () => {
    const out = await listProjectsTree();
    setTree(out.tree || {});
  };

  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    refresh();
  }, [refreshToken]);

  useEffect(() => {
    if (!openItem) return;
    (async () => {
      const d = await loadProject(openItem.category, openItem.file);
      setDetails(d);
    })();
  }, [openItem]);

  const cats = useMemo(() => Object.keys(tree).sort(), [tree]);

  const onDelete = async (cat: string, file: string) => {
    if (!confirm("Delete this saved project?")) return;
    await deleteProject(cat, file);
    setDetails(null);
    setOpenItem(null);
    await refresh();
  };

  const toggleItem = (category: string, file: string) => {
    if (openItem && openItem.category === category && openItem.file === file) {
      setOpenItem(null);
      setDetails(null);
    } else {
      setOpenItem({ category, file });
    }
  };

  const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString() : "");

  return (
    <div className="rounded-3xl border bg-white/80 shadow-sm">
      <div className="p-5 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <button onClick={refresh} className="text-sm px-3 py-1 border rounded-xl hover:bg-gray-50">
          Refresh
        </button>
      </div>
      <div className="divide-y">
        {cats.length === 0 && (
          <div className="p-5 text-sm text-gray-500">No saved projects yet.</div>
        )}
        {cats.map((cat) => (
          <div key={cat}>
            <button
              onClick={() => setOpenCat(openCat === cat ? null : cat)}
              className="w-full text-left px-5 py-3 hover:bg-gray-50 flex justify-between items-center"
            >
              <span className="font-medium capitalize">{cat.replace("_", " ")}</span>
              <span className="text-xs text-gray-500">{tree[cat].items.length} items</span>
            </button>
            {openCat === cat && (
              <div className="px-5 pb-4 grid gap-2">
                {tree[cat].items.map((it) => (
                  <div key={`${cat}/${it.file}`}>
                    <button
                      onClick={() => toggleItem(cat, it.file)}
                      className="w-full text-left rounded-2xl border px-4 py-3 hover:bg-gray-50"
                      title="Click to expand/collapse"
                    >
                      <div className="flex justify-between items-center">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.title}</div>
                          <div className="text-xs text-gray-500 truncate">{it.file}</div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {it.minutes ? `${it.minutes} min` : ""}
                          {it.words ? ` · ${fmt(it.words)} words` : ""}
                        </div>
                      </div>
                    </button>

                    {openItem &&
                      openItem.category === cat &&
                      openItem.file === it.file &&
                      details && (
                        <div className="mt-2 mb-3 p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-white border">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold">Details</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {details?.meta?.target_minutes ?? ""} min
                              </span>
                              {typeof details?.meta?.estimated_word_count === "number" && (
                                <span className="text-xs text-gray-500">
                                  · {fmt(details.meta.estimated_word_count)} words
                                </span>
                              )}
                              <button
                                onClick={() => onDelete(cat, it.file)}
                                className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <CopyBlock
                              label="Expanded title (suggestion)"
                              value={`${details.title} ${hookForType(cat)}`}
                            />
                            <CopyBlock label="Title" value={details.title} />
                            <CopyBlock label="Description" value={details.description} />
                            <CopyBlock
                              label="Hashtags"
                              value={(details.hashtags || []).join(" ")}
                            />
                            <CopyBlock
                              label="Thumbnail prompt"
                              value={details.thumbnail_prompt}
                            />
                            <CopyBlock
                              label="Hero video prompt (Luma)"
                              value={details.hero_video_prompt}
                            />
                            <CopyBlock
                              label="Scene prompts (including extra)"
                              value={details.scene_prompts}
                            />
                            <CopyBlock label="Full script" value={details.script} />
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
