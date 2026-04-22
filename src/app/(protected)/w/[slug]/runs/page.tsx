import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RunsRealtimeSection } from "@/components/runs/runs-realtime-section";
import { getRunsPageVm, type RunsPageVm } from "@/lib/view-models/runs";
import { buildRunsBuckets } from "@/lib/view-models/runs-shared";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceRunsPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const global = await getRunsPageVm();
  const cards = [...global.active, ...global.history].filter(
    (card) => card.workspaceId === workspace.id,
  );
  const buckets = buildRunsBuckets(cards);

  const viewModel: RunsPageVm = {
    hero: {
      eyebrow: `${workspace.name} · 运行`,
      title: "工作区运行时间线",
      subtitle: "聚焦本工作区的 RunState(运行状态) 与事件流，已过滤跨工作区噪音。",
      stats: [
        { label: "活跃运行", value: String(buckets.active.length) },
        { label: "历史运行", value: String(buckets.history.length) },
        {
          label: "失败数",
          value: String(cards.filter((card) => card.status.label === "失败").length),
        },
      ],
    },
    active: buckets.active,
    history: buckets.history,
    signals: buckets.signals,
  };

  return (
    <ConsolePage hero={viewModel.hero}>
      <RunsRealtimeSection initialViewModel={viewModel} />
    </ConsolePage>
  );
}
