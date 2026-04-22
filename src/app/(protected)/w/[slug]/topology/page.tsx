import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { TopologyCanvas } from "@/components/topology/topology-map";
import { getTopologyPageVm } from "@/lib/view-models/topology";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceTopologyPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const global = await getTopologyPageVm();
  const activeRoles = global.activeRoles.filter(
    (role) => role.workspaceId === workspace.id,
  );
  const humanNodes = global.graph.nodes.filter((n) => n.kind === "人工环节");
  const systemNodes = global.graph.nodes.filter((n) => n.kind === "系统环节");

  const hero = {
    eyebrow: `${workspace.name} · 拓扑`,
    title: "工作区角色拓扑",
    subtitle: "聚焦该工作区当前激活的角色与执行链路。",
    stats: [
      { label: "角色数", value: String(global.graph.nodes.length) },
      { label: "活跃角色", value: String(activeRoles.length) },
      {
        label: "热点节点",
        value: String(global.graph.nodes.filter((node) => node.statusLabel !== "健康").length),
      },
    ],
  };

  return (
    <ConsolePage hero={hero}>
      <div className="flex flex-col gap-6">
        <MetricStrip items={global.signals} />

        <Panel title="执行网络" eyebrow={global.graph.scopeLabel}>
          <TopologyCanvas viewModel={global} />
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
              本工作区活跃角色
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">实时高亮</h2>
            <p className="mt-1 text-xs text-white/50">
              基于 {workspace.name} 的 RunState.current_role / pending_gate
            </p>
            <div className="mt-4 space-y-2">
              {activeRoles.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/50">
                  暂无活跃角色
                </p>
              ) : (
                activeRoles.map((role) => (
                  <Link
                    key={`${role.workspaceId}:${role.runKey}:${role.roleSlug}`}
                    href={`/w/${encodeURIComponent(workspace.slug)}/runs/${encodeURIComponent(role.runKey)}`}
                    className="block rounded-2xl border border-white/10 bg-white/4 p-3 transition hover:border-cyan-300/40"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-white">{role.roleSlug}</p>
                      <span className="font-mono text-[10px] text-white/40">
                        {role.lastEventType}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-white/60">
                      run {role.runKey}
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
