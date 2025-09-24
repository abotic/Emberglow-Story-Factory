import { CopyBlock } from "./CopyBlock";

type Props = { data: any | null };

export function OutputBlocks({ data }: Props) {
  if (!data) return null;
  return (
    <div className="mt-6">
      <CopyBlock label="Title" value={data.title} />
      <CopyBlock label="Description" value={data.description} />
      <CopyBlock
        label="Hashtags"
        value={Array.isArray(data.hashtags) ? data.hashtags.join(" ") : ""}
      />
      <CopyBlock label="Thumbnail Prompt" value={data.thumbnail_prompt} />
      <CopyBlock label="Hero Video Prompt (Luma)" value={data.hero_video_prompt} />
      <CopyBlock label="Scene Prompts (30s beats)" value={data.scene_prompts} />
      <CopyBlock label="Full Script" value={data.script} />
    </div>
  );
}
