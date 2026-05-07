"use client";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import type { RuntimeQualityRiskVm } from "@/lib/view-models/runtime-observability";

export function RuntimeOverviewPanel({ overview }: { overview: RuntimeQualityRiskVm }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="rounded-[26px] border border-white/8 bg-white/[0.035] p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
              {overview.quality.timeRangeLabel}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">质量指标</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
            {overview.quality.projectId || "全部项目"}
          </span>
        </div>
        <MetricStrip items={overview.quality.cards} />
      </section>
      <section className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,13,20,0.72),rgba(8,15,25,0.92))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-rose-200/80">
              结构化摘要
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">风险与审计</h3>
          </div>
          <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">
            {overview.risk.events.length} 条
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {overview.risk.events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/50">
              暂无高风险审计事件
            </p>
          ) : (
            overview.risk.events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-rose-300/15 bg-black/20 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{event.eventType}</span>
                  <span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-2 py-0.5 text-[11px] text-rose-100">
                    {event.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-white/60">{event.summary}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  {event.projectId} / {event.runId} / {event.stage}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
