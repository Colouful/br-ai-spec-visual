import type { ReactNode } from "react";

import { MetricStrip } from "@/components/dashboard/metric-strip";
import type { PageHeroVm } from "@/lib/view-models/types";

export function ConsolePage({
  hero,
  children,
  actions,
}: {
  hero: PageHeroVm;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#04070d] text-white">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_24%),linear-gradient(180deg,#05070d_0%,#08101b_48%,#04070d_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <div className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
          <header className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,25,0.96),rgba(13,21,34,0.88))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-cyan-300/80">
                  {hero.eyebrow}
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {hero.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                  {hero.subtitle}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
            <div className="mt-8">
              <MetricStrip items={hero.stats} />
            </div>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
