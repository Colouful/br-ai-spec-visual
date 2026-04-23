import Link from "next/link";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { WorkspaceConnectCard } from "@/components/workspaces/workspace-connect-card";
import { WorkspaceHealthCard } from "@/components/workspaces/workspace-health-card";
import { WorkspaceOnboardingCard } from "@/components/workspaces/workspace-onboarding-card";
import type { WorkspaceDetailVm } from "@/lib/view-models/workspaces";

export function WorkspaceDetail({ viewModel }: { viewModel: WorkspaceDetailVm }) {
  return (
    <div className="space-y-6">
      <WorkspaceHealthCard health={viewModel.health} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
        <Panel
          title="工作区画像"
          eyebrow={viewModel.workspace.zone}
          aside={<StatusBadge badge={viewModel.workspace.badge} />}
        >
          <div className="space-y-5">
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              {viewModel.workspace.description}
            </p>
            <MetricStrip items={viewModel.metrics} />
            <div className="flex flex-wrap gap-2">
              {viewModel.workspace.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/8 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.26em] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Panel>
        <WorkspaceOnboardingCard
          workspaceSlug={viewModel.workspace.slug}
          onboarding={viewModel.onboarding}
        />
        <Panel title="最近运行" eyebrow="执行流">
          <div className="space-y-3">
            {viewModel.recentRuns.map((run) => (
              <Link
                href={`/runs/${run.id}`}
                key={run.id}
                className="flex flex-col gap-3 rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium text-white">{run.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{run.updatedAt}</p>
                  </div>
                  <StatusBadge badge={run.status} compact />
                </div>
                <p className="text-sm leading-6 text-slate-300">{run.summary}</p>
              </Link>
            ))}
          </div>
        </Panel>
        </div>
        <div className="space-y-6">
          <WorkspaceConnectCard
            workspaceId={viewModel.workspace.id}
            workspaceSlug={viewModel.workspace.slug}
            workspaceName={viewModel.workspace.name}
            rootPath={viewModel.onboarding.workspaceRootPath}
          />
          <Panel title="进行中变更" eyebrow="控制面">
            <div className="space-y-3">
              {viewModel.openChanges.map((change) => (
                <Link
                  href={`/changes/${change.id}`}
                  key={change.id}
                  className="block rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-amber-300/20 hover:bg-amber-300/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium text-white">{change.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {change.owner} · {change.updatedAt}
                      </p>
                    </div>
                    <StatusBadge badge={change.status} compact />
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
