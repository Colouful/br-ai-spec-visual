import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { RunDetail } from "@/components/runs/run-detail";
import { getRunDetailVm } from "@/lib/view-models/runs";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const viewModel = await getRunDetailVm(runId);

  if (!viewModel) {
    notFound();
  }

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="运行订阅" workspaceIds={[viewModel.run.workspaceId]} />}
    >
      <RunDetail viewModel={viewModel} />
    </ConsolePage>
  );
}
