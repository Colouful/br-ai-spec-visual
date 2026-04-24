import clsx from "clsx";

import type { StatusBadge as StatusBadgeModel, StatusTone } from "@/lib/view-models/status";

const TONE_CLASSES: Record<StatusTone, string> = {
  slate:
    "border-white/10 bg-white/6 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  sky: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  lime: "border-lime-400/20 bg-lime-400/10 text-lime-100",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
};

const RUNNING_BADGE_CLASSES =
  "[border-color:var(--status-running-border)] [background-color:var(--status-running-bg)] [color:var(--status-running-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]";

const RUNNING_DOT_CLASSES = "[background-color:var(--status-running-dot)]";

export function getToneClasses(tone: StatusTone): string {
  return TONE_CLASSES[tone];
}

export function StatusBadge({
  badge,
  compact = false,
}: {
  badge: StatusBadgeModel;
  compact?: boolean;
}) {
  const isRunningBadge = badge.tone === "lime" && badge.pulse;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border font-mono text-[11px] uppercase tracking-[0.24em]",
        compact ? "px-2.5 py-1" : "px-3 py-1.5",
        isRunningBadge ? RUNNING_BADGE_CLASSES : getToneClasses(badge.tone),
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          badge.pulse && "animate-pulse",
          isRunningBadge && RUNNING_DOT_CLASSES,
          badge.tone === "slate" && "bg-white/40",
          badge.tone === "sky" && "bg-sky-300",
          badge.tone === "lime" && !isRunningBadge && "bg-lime-300",
          badge.tone === "amber" && "bg-amber-300",
          badge.tone === "rose" && "bg-rose-300",
          badge.tone === "cyan" && "bg-cyan-300",
        )}
      />
      {badge.label}
    </span>
  );
}
