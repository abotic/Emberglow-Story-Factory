import { useEffect, useMemo, useState } from "react";
import { listProjectsTree, loadProject, deleteProject } from "../../lib/api";
import type { ProjectsTree, ProjectDetails as ProjectDetailsType } from "../../types";
import { ProjectCard } from "./ProjectCard";
import { ProjectDetails } from "./ProjectDetails";

type Props = {
  refreshToken: number;
};

export function ProjectBrowser({ refreshToken }: Props) {
  const [tree, setTree] = useState<ProjectsTree>({});
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<{ category: string; file: string } | null>(null);
  const [details, setDetails] = useState<ProjectDetailsType | null>(null);

  const refresh = async () => {
    const out = await listProjectsTree();
    setTree(out.tree || {});
  };

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

  const categories = useMemo(() => Object.keys(tree).sort(), [tree]);

  const handleDelete = async (cat: string, file: string) => {
    if (!confirm("Delete this saved project?")) return;
    await deleteProject(cat, file);
    setDetails(null);
    setOpenItem(null);
    await refresh();
  };

  const toggleItem = (category: string, file: string) => {
    if (openItem?.category === category && openItem?.file === file) {
      setOpenItem(null);
      setDetails(null);
    } else {
      setOpenItem({ category, file });
    }
  };

  return (
    <div className="rounded-3xl border bg-white/80 shadow-sm">
      <div className="p-5 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <button onClick={refresh} className="text-sm px-3 py-1 border rounded-xl hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <div className="divide-y">
        {categories.length === 0 && (
          <div className="p-5 text-sm text-gray-500">No saved projects yet.</div>
        )}

        {categories.map((cat) => (
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
                {tree[cat].items.map((item) => (
                  <div key={`${cat}/${item.file}`}>
                    <ProjectCard
                      item={item}
                      isOpen={openItem?.category === cat && openItem?.file === item.file}
                      onClick={() => toggleItem(cat, item.file)}
                    />

                    {openItem?.category === cat && openItem?.file === item.file && details && (
                      <ProjectDetails
                        details={details}
                        category={cat}
                        onDelete={() => handleDelete(cat, item.file)}
                      />
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