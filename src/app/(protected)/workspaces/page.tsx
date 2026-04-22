import { ConsolePage } from "@/components/dashboard/console-page";
import { MetricStrip } from "@/components/dashboard/metric-strip";
import { WorkspacesRealtimeSection } from "@/components/workspaces/workspaces-realtime-section";
import { getOverviewVm } from "@/lib/view-models/overview";
import { getWorkspacesPageVm } from "@/lib/view-models/workspaces";

export default async function WorkspacesPage() {
  const [viewModel, overview] = await Promise.all([
    getWorkspacesPageVm(),
    getOverviewVm(),
  ]);

  const heroWithTotals = {
    ...viewModel.hero,
    stats: [
      { label: "工作区", value: String(overview.totals.workspaces) },
      { label: "活跃运行", value: String(overview.totals.activeRuns) },
      { label: "今日归档", value: String(overview.totals.archivedToday) },
      { label: "Outbox 积压", value: String(overview.totals.pendingOutbox) },
    ],
  };

  return (
    <ConsolePage hero={heroWithTotals}>
      <div className="space-y-6">
        <MetricStrip
          items={[
            { label: "工作区", value: String(overview.totals.workspaces) },
            { label: "活跃运行", value: String(overview.totals.activeRuns) },
            { label: "今日归档", value: String(overview.totals.archivedToday) },
            { label: "Outbox 积压", value: String(overview.totals.pendingOutbox) },
          ]}
        />
        <WorkspacesRealtimeSection initialViewModel={viewModel} />
      </div>
    </ConsolePage>
  );
}
