import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { SpecsManagement } from "@/components/specs/specs-management";
import { getSpecsPageVm, type SpecsPageVm } from "@/lib/view-models/specs";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceSpecsPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const global = await getSpecsPageVm();
  const rows = global.rows.filter((row) => row.workspaceId === workspace.id);
  const viewModel: SpecsPageVm = {
    hero: {
      eyebrow: `${workspace.name} · 规范`,
      title: "工作区规范资产",
      subtitle: "按 proposal / tasks / design / spec 文档维度集中治理。",
      stats: [
        { label: "文档数", value: String(rows.length) },
        {
          label: "评审中",
          value: String(rows.filter((row) => row.status.label === "评审中").length),
        },
      ],
    },
    rows,
  };

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="规范订阅" workspaceIds={[workspace.id]} />}
    >
      <SpecsManagement viewModel={viewModel} />
    </ConsolePage>
  );
}
