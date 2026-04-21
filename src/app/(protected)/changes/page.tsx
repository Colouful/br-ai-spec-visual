import { ConsolePage } from "@/components/dashboard/console-page";
import { ChangesRealtimeSection } from "@/components/changes/changes-realtime-section";
import { getChangesPageVm } from "@/lib/view-models/changes";

export default async function ChangesPage() {
  const viewModel = await getChangesPageVm();

  return (
    <ConsolePage hero={viewModel.hero}>
      <ChangesRealtimeSection initialViewModel={viewModel} />
    </ConsolePage>
  );
}
