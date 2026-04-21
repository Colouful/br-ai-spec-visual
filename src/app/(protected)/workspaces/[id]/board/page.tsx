import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { TraceStreamDrawer } from "@/components/trace/trace-stream-drawer";
import { WorkspaceBoard } from "@/components/workspaces/workspace-board";
import { WorkspaceHealthCard } from "@/components/workspaces/workspace-health-card";
import { getWorkspaceBoardVm } from "@/lib/view-models/board";
import { computeWorkspaceHealth } from "@/lib/view-models/workspace-health";
import { getWorkspaceDetailVm } from "@/lib/view-models/workspaces";

export default async function WorkspaceBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detailVm, boardVm, health] = await Promise.all([
    getWorkspaceDetailVm(id),
    getWorkspaceBoardVm(id),
    computeWorkspaceHealth(id),
  ]);

  if (!detailVm) {
    notFound();
  }

  return (
    <ConsolePage
      hero={{
        eyebrow: detailVm.workspace.zone,
        title: `${detailVm.workspace.name} · Kanban`,
        subtitle:
          "把工作区里的提案、运行、守门评审与归档放在同一面板上，拖拽卡片即时下发审批指令到 auto。",
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
            label="Trace Stream"
          />
          <RealtimeWorkspaceBridge
            label="工作区订阅"
            workspaceIds={[detailVm.workspace.id]}
          />
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <WorkspaceBoard workspaceId={detailVm.workspace.id} board={boardVm} />
        <WorkspaceHealthCard health={health} />
      </div>
    </ConsolePage>
  );
}
