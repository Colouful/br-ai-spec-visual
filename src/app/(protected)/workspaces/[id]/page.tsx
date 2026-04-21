import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { WorkspaceDetail } from "@/components/workspaces/workspace-detail";
import { getWorkspaceDetailVm } from "@/lib/view-models/workspaces";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewModel = await getWorkspaceDetailVm(id);

  if (!viewModel) {
    notFound();
  }

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="工作区订阅" workspaceIds={[viewModel.workspace.id]} />}
    >
      <WorkspaceDetail viewModel={viewModel} />
    </ConsolePage>
  );
}
