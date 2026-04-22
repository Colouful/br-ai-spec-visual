import type { ReactNode } from "react";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import type { PageHeroVm } from "@/lib/view-models/types";
import { cn } from "@/lib/utils";

export function ConsolePage({
  hero,
  children,
  actions,
  contentStretch = false,
}: {
  hero: PageHeroVm;
  children: ReactNode;
  actions?: ReactNode;
  /** 看板等：占满主内容区剩余高度，子项用内部滚动，避免整页被内容撑得过长 */
  contentStretch?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-6",
        contentStretch && "min-h-0 flex-1",
      )}
    >
      <header className="shrink-0 glass-panel-strong relative overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-cyan-300/80">
              {hero.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              {hero.subtitle}
            </p>
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-3">{actions}</div>
          ) : null}
        </div>
        <div className="relative mt-6">
          <MetricStrip items={hero.stats} />
        </div>
      </header>
      {contentStretch ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
