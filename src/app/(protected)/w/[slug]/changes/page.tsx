import { notFound } from "next/navigation";

import { ChangesRealtimeSection } from "@/components/changes/changes-realtime-section";
import { ConsolePage } from "@/components/dashboard/console-page";
import { buildChangeColumns, buildChangeSignals } from "@/lib/view-models/changes-shared";
import { getChangesPageVm, type ChangesPageVm } from "@/lib/view-models/changes";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceChangesPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const global = await getChangesPageVm();
  const cards = global.columns
    .flatMap((column) => column.cards)
    .filter((card) => card.workspaceId === workspace.id);
  const columns = buildChangeColumns(cards);

  const viewModel: ChangesPageVm = {
    hero: {
      eyebrow: `${workspace.name} · 变更`,
      title: "工作区变更看板",
      subtitle:
        "聚焦当前工作区的 change_documents(变更文档索引)，按状态分列，便于守门评审。",
      stats: [
        { label: "文档数", value: String(cards.length) },
        {
          label: "评审中",
          value: String(columns.find((item) => item.id === "review")?.cards.length ?? 0),
        },
        {
          label: "已阻断",
          value: String(columns.find((item) => item.id === "blocked")?.cards.length ?? 0),
        },
      ],
    },
    columns,
    signals: buildChangeSignals(cards),
  };

  return (
    <ConsolePage hero={viewModel.hero}>
      <ChangesRealtimeSection initialViewModel={viewModel} />
    </ConsolePage>
  );
}
