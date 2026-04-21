import { ConsolePage } from "@/components/dashboard/console-page";
import { RunsRealtimeSection } from "@/components/runs/runs-realtime-section";
import { getRunsPageVm } from "@/lib/view-models/runs";

export default async function RunsPage() {
  const viewModel = await getRunsPageVm();

  return (
    <ConsolePage hero={viewModel.hero}>
      <RunsRealtimeSection initialViewModel={viewModel} />
    </ConsolePage>
  );
}
