import { ConsolePage } from "@/components/dashboard/console-page";
import { WorkspacesRealtimeSection } from "@/components/workspaces/workspaces-realtime-section";
import { getWorkspacesPageVm } from "@/lib/view-models/workspaces";

export default async function WorkspacesPage() {
  const viewModel = await getWorkspacesPageVm();

  return (
    <ConsolePage hero={viewModel.hero}>
      <WorkspacesRealtimeSection initialViewModel={viewModel} />
    </ConsolePage>
  );
}
