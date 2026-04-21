import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { SpecsManagement } from "@/components/specs/specs-management";
import { getSpecsPageVm } from "@/lib/view-models/specs";

export default async function SpecsPage() {
  const viewModel = await getSpecsPageVm();

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="规范订阅" workspaceIds={Array.from(new Set(viewModel.rows.map((row) => row.workspaceId)))} />}
    >
      <SpecsManagement viewModel={viewModel} />
    </ConsolePage>
  );
}
