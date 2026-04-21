import { ConsolePage } from "@/components/dashboard/console-page";
import { MembersManagement } from "@/components/members/members-management";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { getMembersPageVm } from "@/lib/view-models/members";

export default async function MembersPage() {
  const viewModel = await getMembersPageVm();
  const workspaceIds = viewModel.rows.flatMap((row) => row.workspaces.map((workspace) => workspace.id));

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="成员订阅" workspaceIds={workspaceIds} />}
    >
      <MembersManagement viewModel={viewModel} />
    </ConsolePage>
  );
}
