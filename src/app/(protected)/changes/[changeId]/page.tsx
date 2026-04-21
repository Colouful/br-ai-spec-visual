import { notFound } from "next/navigation";

import { ChangeDetail } from "@/components/changes/change-detail";
import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { getChangeDetailVm } from "@/lib/view-models/changes";

export default async function ChangeDetailPage({
  params,
}: {
  params: Promise<{ changeId: string }>;
}) {
  const { changeId } = await params;
  const decodedChangeId = (() => {
    try {
      return decodeURIComponent(changeId);
    } catch {
      return changeId;
    }
  })();
  const viewModel =
    (await getChangeDetailVm(decodedChangeId)) ??
    (await getChangeDetailVm(changeId));

  if (!viewModel) {
    notFound();
  }

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="Change" workspaceIds={[viewModel.change.workspaceId]} />}
    >
      <ChangeDetail viewModel={viewModel} />
    </ConsolePage>
  );
}
