import Link from "next/link";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { WorkspacesPageVm } from "@/lib/view-models/workspaces";

export function WorkspacesOverview({ viewModel }: { viewModel: WorkspacesPageVm }) {
  return (
    <div className="space-y-6">
      <Panel title="健康分布" eyebrow="工作区概览">
        <MetricStrip items={viewModel.healthBands} />
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        {viewModel.workspaces.map((workspace) => (
          <Panel
            key={workspace.id}
            className="relative overflow-hidden"
            aside={<StatusBadge badge={workspace.badge} />}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">
                  {workspace.zone}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {workspace.name}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  {workspace.description}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[20px] border border-white/6 bg-white/4 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">
                    成员
                  </p>
                  <p className="mt-2 text-sm text-white">{workspace.owners}</p>
                </div>
                <div className="rounded-[20px] border border-white/6 bg-white/4 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">
                    项目数
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">{workspace.projectCount}</p>
                </div>
                <div className="rounded-[20px] border border-white/6 bg-white/4 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">
                    吞吐量
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">{workspace.throughput}</p>
                </div>
                <div className="rounded-[20px] border border-white/6 bg-white/4 px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">
                    成功率
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">{workspace.successRate}</p>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-[22px] border border-cyan-400/10 bg-cyan-400/6 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-200/80">
                    当前关注点
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">{workspace.focus}</p>
                </div>
                <div className="rounded-[22px] border border-white/6 bg-white/3 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    动态概览
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-200">
                    <p>{workspace.activeRuns} 个活跃运行</p>
                    <p>{workspace.openChanges} 个进行中变更</p>
                    <p>{workspace.lastActivity}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {workspace.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/8 bg-white/4 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/workspaces/${workspace.id}`}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
                >
                  查看工作区
                </Link>
                <Link
                  href="/runs"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
                >
                  查看运行记录
                </Link>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
