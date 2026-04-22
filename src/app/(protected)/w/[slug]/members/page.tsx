import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { MembersManagement } from "@/components/members/members-management";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { getMembersPageVm, type MembersPageVm } from "@/lib/view-models/members";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceMembersPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const global = await getMembersPageVm();
  const rows = global.rows
    .filter((row) => row.workspaces.some((ws) => ws.id === workspace.id))
    .map((row) => ({
      ...row,
      workspaces: row.workspaces.filter((ws) => ws.id === workspace.id),
      workspaceCount: 1,
    }));
  const viewModel: MembersPageVm = {
    hero: {
      eyebrow: `${workspace.name} · 成员`,
      title: "工作区成员与角色",
      subtitle: "仅展示绑定到该工作区的成员、会话与最近活动。",
      stats: [
        { label: "成员数", value: String(rows.length) },
        {
          label: "管理员",
          value: String(rows.filter((row) => row.roleLabel === "管理员").length),
        },
        {
          label: "活跃会话",
          value: String(rows.reduce((sum, row) => sum + row.sessionCount, 0)),
        },
      ],
    },
    rows,
  };

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="成员订阅" workspaceIds={[workspace.id]} />}
    >
      <MembersManagement viewModel={viewModel} />
    </ConsolePage>
  );
}
