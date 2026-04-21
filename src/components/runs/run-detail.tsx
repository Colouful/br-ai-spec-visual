import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RunEvidenceWall } from "@/components/runs/run-evidence-wall";
import { RunGatePanel } from "@/components/runs/run-gate-panel";
import { RunLiveClock } from "@/components/runs/run-live-clock";
import { RunTraceStream } from "@/components/runs/run-trace-stream";
import type { RunDetailVm } from "@/lib/view-models/runs";

export function RunDetail({ viewModel }: { viewModel: RunDetailVm }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        <Panel title="运行概况" eyebrow={viewModel.run.workspaceName}>
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              <StatusBadge badge={viewModel.run.status} />
              <p className="text-sm leading-6 text-slate-300">
                {viewModel.run.summary}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  触发方式 · {viewModel.run.trigger}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  角色 · {viewModel.run.operator}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  耗时 · {viewModel.run.duration}
                </span>
              </div>
              {viewModel.run.status.label === "运行中" ? (
                <RunLiveClock
                  startedAt={viewModel.run.startedAtIso}
                  updatedAt={viewModel.run.updatedAtIso}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={`/workspaces/${viewModel.run.workspaceId}`}
                className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-center text-xs font-mono uppercase tracking-[0.22em] text-cyan-100 transition hover:border-cyan-200/60"
              >
                打开工作区
              </Link>
              <Link
                href={`/workspaces/${viewModel.run.workspaceId}/board`}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-xs font-mono uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
              >
                看板视图
              </Link>
              {viewModel.run.changeId ? (
                <Link
                  href={`/changes/${viewModel.run.changeId}`}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-xs font-mono uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
                >
                  关联变更
                </Link>
              ) : null}
            </div>
          </div>
        </Panel>

        <RunEvidenceWall stages={viewModel.run.evidenceStages} />

        <Panel title="阶段时间线" eyebrow="历史事件">
          <div className="space-y-3">
            {viewModel.run.stages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/50">
                暂无阶段事件
              </p>
            ) : (
              viewModel.run.stages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {stage.label}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-300">
                        {stage.summary}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <StatusBadge badge={stage.status} compact />
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        {stage.duration}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
      <div className="space-y-6">
        <RunGatePanel
          workspaceId={viewModel.run.workspaceId}
          runKey={viewModel.run.id}
          gate={viewModel.run.gate}
        />
        <RunTraceStream events={viewModel.run.traceEvents} />
      </div>
    </div>
  );
}
