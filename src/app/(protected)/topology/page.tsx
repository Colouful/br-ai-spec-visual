import { ConsolePage } from "@/components/dashboard/console-page";
import { TopologyMap } from "@/components/topology/topology-map";
import { getTopologyPageVm } from "@/lib/view-models/topology";

export default async function TopologyPage() {
  const viewModel = await getTopologyPageVm();

  return (
    <ConsolePage hero={viewModel.hero}>
      <TopologyMap viewModel={viewModel} />
    </ConsolePage>
  );
}
