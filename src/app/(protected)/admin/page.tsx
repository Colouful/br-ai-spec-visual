import { ConsolePage } from "@/components/dashboard/console-page";
import { OpenSpecGovernanceDashboard } from "@/components/governance/open-spec-governance-dashboard";
import { getGovernanceSummaryViewModel } from "@/lib/view-models/governance";

export const dynamic = "force-dynamic";

export default async function AdminGovernancePage() {
  const summary = await getGovernanceSummaryViewModel();

  return (
    <ConsolePage hero={summary.hero}>
      <OpenSpecGovernanceDashboard summary={summary} />
    </ConsolePage>
  );
}
