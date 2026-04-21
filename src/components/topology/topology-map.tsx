import { getToneClasses } from "@/components/dashboard/status-badge";
import type { TopologyPageVm } from "@/lib/view-models/topology";

export function TopologyCanvas({ viewModel }: { viewModel: TopologyPageVm }) {
  const nodeMap = new Map(viewModel.graph.nodes.map((node) => [node.id, node]));

  return (
    <div className="relative h-[520px] overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_36%),linear-gradient(180deg,rgba(8,12,20,0.88),rgba(5,9,16,0.96))] sm:h-[600px] xl:h-[680px]">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {viewModel.graph.edges.map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={
                edge.weight === "primary"
                  ? "rgba(103,232,249,0.55)"
                  : "rgba(148,163,184,0.36)"
              }
              strokeDasharray={edge.weight === "primary" ? "0" : "2 2"}
              strokeWidth={edge.weight === "primary" ? 0.45 : 0.28}
            />
          );
        })}
      </svg>
      {viewModel.graph.nodes.map((node) => (
        <div
          key={node.id}
          className={`absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-[20px] border px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.34)] sm:w-36 xl:w-40 xl:px-4 xl:py-4 ${getToneClasses(node.tone)}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] opacity-70">
            {node.kind}
          </p>
          <h3 className="mt-1.5 text-sm font-medium text-white xl:mt-2 xl:text-base">
            {node.label}
          </h3>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-200/80 xl:mt-2 xl:text-xs">
            {node.statusLabel}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-200/70 xl:mt-3">
            {node.memberCount} 位成员
          </p>
        </div>
      ))}
    </div>
  );
}
