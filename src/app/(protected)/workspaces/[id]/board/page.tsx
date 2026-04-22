import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { TraceStreamDrawer } from "@/components/trace/trace-stream-drawer";
import { WorkspaceBoard } from "@/components/workspaces/workspace-board";
import { WorkspaceHealthCard } from "@/components/workspaces/workspace-health-card";
import { getWorkspaceBoardVm } from "@/lib/view-models/board";
import { computeWorkspaceHealth } from "@/lib/view-models/workspace-health";
import { getWorkspaceDetailVm } from "@/lib/view-models/workspaces";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export default async function WorkspaceBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await findWorkspaceBySlugOrId(id);
  if (!workspace) {
    notFound();
  }

  const [detailVm, boardVm, health] = await Promise.all([
    getWorkspaceDetailVm(workspace.id),
    getWorkspaceBoardVm(workspace.id),
    computeWorkspaceHealth(workspace.id),
  ]);

  if (!detailVm) {
    notFound();
  }

  return (
    <ConsolePage
      contentStretch
      hero={{
        eyebrow: detailVm.workspace.zone,
        title: `${detailVm.workspace.name} · 看板(Kanban)`,
        subtitle:
          "把工作区里的提案、运行、守门评审与归档放在同一面板上，拖拽卡片即时下发审批指令到 auto(自动执行端)。",
        stats: [
          { label: "活跃运行/变更", value: String(boardVm.totalActive) },
          { label: "已归档", value: String(boardVm.totalArchived) },
          { label: "待审批", value: String(boardVm.pendingGates) },
          { label: "健康度", value: `${health.grade} · ${health.score}` },
        ],
      }}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <TraceStreamDrawer
            workspaceId={detailVm.workspace.id}
            label="轨迹流(Trace Stream)"
          />
          <RealtimeWorkspaceBridge
            label="工作区订阅"
            workspaceIds={[detailVm.workspace.id]}
          />
        </div>
      }
    >
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-6">
        <WorkspaceHealthCard className="shrink-0" health={health} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <WorkspaceBoard workspaceId={detailVm.workspace.id} board={boardVm} />
        </div>
      </div>
    </ConsolePage>
  );
}
