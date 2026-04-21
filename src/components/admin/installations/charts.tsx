"use client";

import clsx from "clsx";

export function BarList({
  items,
  valueFormatter,
  emptyText = "暂无数据",
}: {
  items: Array<{ label: string; value: number }>;
  valueFormatter?: (value: number) => string;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
        {emptyText}
      </p>
    );
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const pct = (item.value / max) * 100;
        return (
          <li key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium text-slate-200">{item.label}</span>
              <span className="font-mono text-cyan-300/80">
                {valueFormatter ? valueFormatter(item.value) : item.value}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 via-indigo-400/70 to-purple-400/70"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function LineChart({
  points,
  height = 160,
  emptyText = "暂无数据",
}: {
  points: Array<{ x: string; y: number }>;
  height?: number;
  emptyText?: string;
}) {
  if (points.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
        {emptyText}
      </p>
    );
  }
  const width = 640;
  const max = Math.max(...points.map((p) => p.y), 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const toY = (v: number) => height - (v / max) * (height - 20) - 4;

  const path = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${idx * stepX} ${toY(p.y)}`)
    .join(" ");
  const area = `${path} L ${(points.length - 1) * stepX} ${height} L 0 ${height} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
      >
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#line-area)" />
        <path d={path} fill="none" stroke="rgba(165, 243, 252, 0.9)" strokeWidth={2} />
        {points.map((p, idx) => (
          <circle
            key={p.x}
            cx={idx * stepX}
            cy={toY(p.y)}
            r={2.5}
            fill="rgba(34,211,238,1)"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-white/40">
        <span>{points[0].x}</span>
        <span>{points[points.length - 1].x}</span>
      </div>
    </div>
  );
}

export function Donut({
  items,
  size = 160,
}: {
  items: Array<{ label: string; value: number }>;
  size?: number;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
        暂无数据
      </p>
    );
  }
  const palette = [
    "rgba(34,211,238,0.85)",
    "rgba(129,140,248,0.85)",
    "rgba(168,85,247,0.85)",
    "rgba(244,114,182,0.85)",
    "rgba(251,191,36,0.85)",
    "rgba(52,211,153,0.85)",
  ];
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const arcs = items.map((item, idx) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += item.value;
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, color: palette[idx % palette.length] };
  });
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0">
        {arcs.map((arc, idx) => (
          <path key={idx} d={arc.d} fill={arc.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#0a0f1a" />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          className="fill-white font-mono text-sm"
        >
          {total}
        </text>
      </svg>
      <ul className="flex-1 space-y-1 text-xs">
        {items.map((item, idx) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: palette[idx % palette.length] }}
            />
            <span className="flex-1 truncate text-slate-200">{item.label}</span>
            <span className="font-mono text-white/60">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PulseDot({ className }: { className?: string }) {
  return (
    <span className={clsx("relative inline-flex h-2.5 w-2.5", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}
