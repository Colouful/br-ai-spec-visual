import Link from "next/link";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RunLiveClock } from "@/components/runs/run-live-clock";
import type { RunsPageVm } from "@/lib/view-models/runs";
import { isLiveRunCard } from "@/lib/view-models/runs-shared";

function RunCard({
  run,
  live,
}: {
  run: RunsPageVm["active"][number];
  live: boolean;
}) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="block rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-lime-300/20 hover:bg-lime-300/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
            {run.workspaceName}
          </p>
          <h3 className="text-lg font-medium text-white">{run.title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">{run.summary}</p>
        </div>
        <StatusBadge badge={run.status} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3 rounded-[20px] border border-white/6 bg-black/20 px-4 py-4">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
            <span>{run.trigger}</span>
            <span className="font-mono text-slate-400">{run.progressLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-lime-300 to-lime-200"
              style={{ width: `${Math.max(8, Math.round(run.progressValue * 100))}%` }}
            />
          </div>
        </div>
        <div className="rounded-[20px] border border-white/6 bg-white/3 px-4 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
            执行角色
          </p>
          <p className="mt-2 text-sm text-white">{run.operator}</p>
          <p className="mt-3 text-sm text-slate-400">开始于 {run.startedAt}</p>
          {live ? (
            <div className="mt-3">
              <RunLiveClock startedAt={run.startedAtIso} updatedAt={run.updatedAtIso} />
            </div>
          ) : (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              {run.duration} · 更新于 {run.updatedAt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RunsTimeline({ viewModel }: { viewModel: RunsPageVm }) {
  return (
    <div className="space-y-6">
      <Panel title="时间线信号" eyebrow="执行脉冲">
        <MetricStrip items={viewModel.signals} />
      </Panel>
      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Panel title="实时队列" eyebrow="运行中 + 排队中">
          <div className="space-y-4">
            {viewModel.active.map((run) => (
              <RunCard key={run.id} run={run} live={isLiveRunCard(run)} />
            ))}
          </div>
        </Panel>
        <Panel title="历史记录" eyebrow="最近关闭">
          <div className="space-y-4">
            {viewModel.history.map((run) => (
              <RunCard key={run.id} run={run} live={false} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
