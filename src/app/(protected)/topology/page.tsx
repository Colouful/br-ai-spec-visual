import Link from "next/link";

import { ConsolePage } from "@/components/dashboard/console-page";
import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { TopologyCanvas } from "@/components/topology/topology-map";
import { getTopologyPageVm } from "@/lib/view-models/topology";

export default async function TopologyPage() {
  const viewModel = await getTopologyPageVm();
  const humanNodes = viewModel.graph.nodes.filter((n) => n.kind === "人工环节");
  const systemNodes = viewModel.graph.nodes.filter((n) => n.kind === "系统环节");

  return (
    <ConsolePage hero={viewModel.hero}>
      <div className="flex flex-col gap-6">
        <MetricStrip items={viewModel.signals} />

        <Panel title="执行网络" eyebrow={viewModel.graph.scopeLabel}>
          <TopologyCanvas viewModel={viewModel} />
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Panel title="人工环节" eyebrow={`${humanNodes.length} 个节点`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {humanNodes.map((node) => (
                <div
                  key={node.id}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                >
                  <h3 className="text-sm font-medium text-white">{node.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-300/80">
                    {node.members.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="系统环节" eyebrow={`${systemNodes.length} 个节点`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {systemNodes.map((node) => (
                <div
                  key={node.id}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                >
                  <h3 className="text-sm font-medium text-white">{node.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-300/80">
                    {node.members.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <aside className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,25,0.96),rgba(13,21,34,0.88))] p-5 lg:col-span-2 xl:col-span-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
              实时角色高亮
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              当前正在执行的角色
            </h2>
            <p className="mt-1 text-xs text-white/50">
              根据 RunState 的 current_role / pending_gate 实时计算
            </p>
            <div className="mt-4 space-y-2">
              {viewModel.activeRoles.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/50">
                  暂无活跃角色，等待 auto 推送 run-state
                </p>
              ) : (
                viewModel.activeRoles.map((role) => (
                  <Link
                    key={`${role.workspaceId}:${role.runKey}:${role.roleSlug}`}
                    href={`/runs/${encodeURIComponent(role.runKey)}`}
                    className="block rounded-2xl border border-white/10 bg-white/4 p-3 transition hover:border-cyan-300/40"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-white">
                        {role.roleSlug}
                      </p>
                      <span className="font-mono text-[10px] text-white/40">
                        {role.lastEventType}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-white/60">
                      {role.workspaceName} · run {role.runKey}
                    </p>
                    {role.pendingGate ? (
                      <span className="mt-2 inline-flex rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] text-fuchsia-200">
                        gate · {role.pendingGate}
                      </span>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </ConsolePage>
  );
}
