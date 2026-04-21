import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { getToneClasses } from "@/components/dashboard/status-badge";
import type { TopologyPageVm } from "@/lib/view-models/topology";

export function TopologyMap({ viewModel }: { viewModel: TopologyPageVm }) {
  const nodeMap = new Map(viewModel.graph.nodes.map((node) => [node.id, node]));
  const humanNodes = viewModel.graph.nodes.filter((node) => node.kind === "人工环节");
  const systemNodes = viewModel.graph.nodes.filter((node) => node.kind === "系统环节");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <Panel title="执行网络" eyebrow={viewModel.graph.scopeLabel}>
        <MetricStrip items={viewModel.signals} />
        <div className="relative mt-6 h-[620px] overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_36%),linear-gradient(180deg,rgba(8,12,20,0.88),rgba(5,9,16,0.96))]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {viewModel.graph.edges.map((edge) => {
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);

              if (!from || !to) {
                return null;
              }

              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={edge.weight === "primary" ? "rgba(103,232,249,0.55)" : "rgba(148,163,184,0.36)"}
                  strokeDasharray={edge.weight === "primary" ? "0" : "2 2"}
                  strokeWidth={edge.weight === "primary" ? 0.45 : 0.28}
                />
              );
            })}
          </svg>
          {viewModel.graph.nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute w-40 -translate-x-1/2 -translate-y-1/2 rounded-[22px] border px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.34)] ${getToneClasses(node.tone)}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] opacity-70">
                {node.kind}
              </p>
              <h3 className="mt-2 text-base font-medium text-white">{node.label}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-200/80">{node.statusLabel}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-200/70">
                {node.memberCount} 位成员
              </p>
            </div>
          ))}
        </div>
      </Panel>
      <div className="space-y-6">
        <Panel title="人工环节" eyebrow={`${humanNodes.length} 个节点`}>
          <div className="space-y-3">
            {humanNodes.map((node) => (
              <div
                key={node.id}
                className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
              >
                <h3 className="text-base font-medium text-white">{node.label}</h3>
                <p className="mt-2 text-sm text-slate-300">{node.members.join(" · ")}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="系统环节" eyebrow={`${systemNodes.length} 个节点`}>
          <div className="space-y-3">
            {systemNodes.map((node) => (
              <div
                key={node.id}
                className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
              >
                <h3 className="text-base font-medium text-white">{node.label}</h3>
                <p className="mt-2 text-sm text-slate-300">{node.members.join(" · ")}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
