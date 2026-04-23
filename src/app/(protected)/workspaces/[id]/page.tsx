import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { WorkspaceDetail } from "@/components/workspaces/workspace-detail";
import { getWorkspaceDetailVm } from "@/lib/view-models/workspaces";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await findWorkspaceBySlugOrId(id);
  if (!workspace) {
    notFound();
  }

  const viewModel = await getWorkspaceDetailVm(workspace.id);

  if (!viewModel) {
    notFound();
  }

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/workspaces/${viewModel.workspace.slug}/board`}
            className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.26em] text-cyan-200 transition hover:border-cyan-200/70 hover:bg-cyan-300/20"
          >
            打开 Kanban
          </Link>
          <RealtimeWorkspaceBridge label="工作区订阅" workspaceIds={[viewModel.workspace.id]} />
        </div>
      }
    >
      <WorkspaceDetail viewModel={viewModel} />
    </ConsolePage>
  );
}
