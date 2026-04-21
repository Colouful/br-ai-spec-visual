import Link from "next/link";

import { ConsolePage } from "@/components/dashboard/console-page";
import { Panel } from "@/components/dashboard/panel";
import { WorkspaceHealthCard } from "@/components/workspaces/workspace-health-card";
import { getOverviewVm } from "@/lib/view-models/overview";

export default async function OverviewPage() {
  const vm = await getOverviewVm();

  return (
    <ConsolePage
      hero={{
        eyebrow: "Overview",
        title: "BR AI Spec · 全局态势板",
        subtitle:
          "把所有工作区的健康度、活跃运行心跳和归档时间线放在一屏上，秒级感知 auto 与 visual 的整体状态。",
        stats: [
          { label: "工作区", value: String(vm.totals.workspaces) },
          { label: "活跃运行", value: String(vm.totals.activeRuns) },
          { label: "今日归档", value: String(vm.totals.archivedToday) },
          { label: "Outbox 积压", value: String(vm.totals.pendingOutbox) },
        ],
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <Panel title="工作区健康卡" eyebrow="按工作区聚合">
            <div className="grid gap-4 md:grid-cols-2">
              {vm.workspaces.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
                  尚未观测到工作区数据
                </p>
              ) : (
                vm.workspaces.map((card) => (
                  <Link
                    key={card.id}
                    href={`/workspaces/${card.id}/board`}
                    className="block transition hover:scale-[1.01]"
                  >
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
                        {card.name}
                      </p>
                      <WorkspaceHealthCard health={card.health} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Active Run · 心跳" eyebrow="实时执行">
            <div className="space-y-2">
              {vm.activeRuns.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
                  暂无活跃运行
                </p>
              ) : (
                vm.activeRuns.map((run) => (
                  <Link
                    key={`${run.workspaceId}:${run.runKey}`}
                    href={`/runs/${encodeURIComponent(run.runKey)}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-300/40"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {run.workspaceName} · {run.runKey}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] text-white/50">
                          {run.lastEventType}
                          {run.currentRole ? ` · ${run.currentRole}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase text-white/70">
                          {run.status}
                        </span>
                        {run.pendingGate ? (
                          <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] text-fuchsia-200">
                            gate · {run.pendingGate}
                          </span>
                        ) : null}
                        <span className="font-mono text-[10px] text-white/40">
                          {run.lastOccurredAtRelative}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Archive · 时间线" eyebrow="归档轨迹">
          <ol className="relative space-y-4 border-l border-white/10 pl-4">
            {vm.archive.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
                暂无归档事件
              </li>
            ) : (
              vm.archive.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[10px] top-3 h-2 w-2 rounded-full border border-emerald-300/40 bg-emerald-300/30" />
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                    <p className="text-sm font-medium text-white">
                      {entry.payloadSummary}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-white/50">
                      {entry.workspaceName} · {entry.runKey}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-white/40">
                      {entry.occurredAtRelative}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ol>
        </Panel>
      </div>
    </ConsolePage>
  );
}
