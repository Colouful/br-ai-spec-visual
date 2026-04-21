import Link from "next/link";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { ChangesPageVm } from "@/lib/view-models/changes";

const SYSTEM_LABELS: Record<string, string> = {
  tasks: "任务开发清单",
  checklist: "交付检查单",
  design: "设计方案",
  iterations: "迭代记录",
  proposal: "变更提案",
  spec: "规格说明",
  "prd-to-delivery": "PRD 到交付",
  "prd-to-release": "PRD 到上线",
  规划: "规划",
  评审: "评审",
  发布: "发布",
  拓扑: "拓扑",
  总览: "总览",
  审计: "审计",
  保护: "保护",
  保留策略: "保留策略",
  调度: "调度",
  时间线: "时间线",
};

function translateSystem(value: string): string {
  return SYSTEM_LABELS[value] ?? SYSTEM_LABELS[value.toLowerCase()] ?? value;
}

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
                        className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[11px] tracking-wide text-slate-300"
                      >
                        {translateSystem(system)}
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
