import type { MetricVm } from "@/lib/view-models/types";

export function MetricStrip({ items }: { items: MetricVm[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
          {item.note ? (
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
