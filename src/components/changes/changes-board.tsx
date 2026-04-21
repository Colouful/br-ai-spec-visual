import Link from "next/link";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { ChangesPageVm } from "@/lib/view-models/changes";

export function ChangesBoard({ viewModel }: { viewModel: ChangesPageVm }) {
  return (
    <div className="space-y-6">
      <Panel title="看板信号" eyebrow="变更流转">
        <MetricStrip items={viewModel.signals} />
      </Panel>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {viewModel.columns.map((column) => (
          <Panel
            key={column.id}
            title={column.label}
            eyebrow={`${column.cards.length} 张卡片`}
            className="min-w-[320px] flex-1"
          >
            <div className="space-y-3">
              {column.cards.map((card) => (
                <Link
                  href={`/changes/${card.id}`}
                  key={card.id}
                  className="block rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-amber-300/20 hover:bg-amber-300/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium text-white">{card.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {card.workspaceName} · {card.updatedAt}
                      </p>
                    </div>
                    <StatusBadge badge={card.status} compact />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.systems.map((system) => (
                      <span
                        key={system}
                        className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300"
                      >
                        {system}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
