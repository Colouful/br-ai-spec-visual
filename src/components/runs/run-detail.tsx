import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RunLiveClock } from "@/components/runs/run-live-clock";
import type { RunDetailVm } from "@/lib/view-models/runs";

export function RunDetail({ viewModel }: { viewModel: RunDetailVm }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Panel title="阶段时间线" eyebrow={viewModel.run.workspaceName}>
          <div className="space-y-4">
            {viewModel.run.stages.map((stage) => (
              <div
                key={stage.id}
                className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium text-white">{stage.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{stage.summary}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <StatusBadge badge={stage.status} compact />
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      {stage.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="日志" eyebrow="最近记录">
          <div className="space-y-2 rounded-[22px] border border-white/8 bg-black/30 p-4 font-mono text-sm leading-6 text-slate-300">
            {viewModel.run.logs.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Panel>
      </div>
      <div className="space-y-6">
      <Panel title="运行概况" eyebrow={viewModel.run.workspaceName}>
          <div className="space-y-4">
            <StatusBadge badge={viewModel.run.status} />
            <p className="text-sm leading-6 text-slate-300">{viewModel.run.summary}</p>
            <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                触发来源
              </p>
              <p className="mt-2 text-sm text-white">{viewModel.run.trigger}</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                执行角色
              </p>
              <p className="mt-2 text-sm text-white">{viewModel.run.operator}</p>
            </div>
            {viewModel.run.status.label === "运行中" ? (
              <RunLiveClock
                startedAt={viewModel.run.startedAtIso}
                updatedAt={viewModel.run.updatedAtIso}
              />
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/workspaces/${viewModel.run.workspaceId}`}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
              >
                打开工作区
              </Link>
              {viewModel.run.changeId ? (
                <Link
                  href={`/changes/${viewModel.run.changeId}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
                >
                  关联变更
                </Link>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
