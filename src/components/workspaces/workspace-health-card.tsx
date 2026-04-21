import type { WorkspaceHealthBreakdown } from "@/lib/view-models/workspace-health";

const TONE_STYLE: Record<"good" | "warn" | "bad", string> = {
  good: "text-emerald-200 bg-emerald-500/15 border-emerald-300/30",
  warn: "text-amber-200 bg-amber-500/15 border-amber-300/30",
  bad: "text-rose-200 bg-rose-500/15 border-rose-300/30",
};

const GRADE_STYLE: Record<WorkspaceHealthBreakdown["grade"], string> = {
  A: "text-emerald-200",
  B: "text-cyan-200",
  C: "text-amber-200",
  D: "text-rose-200",
};

export function WorkspaceHealthCard({
  health,
}: {
  health: WorkspaceHealthBreakdown;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,25,0.96),rgba(13,21,34,0.88))] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            Workspace Health
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">健康度评分</h3>
        </div>
        <div className="text-right">
          <p
            className={`font-mono text-4xl font-semibold leading-none ${GRADE_STYLE[health.grade]}`}
          >
            {health.grade}
          </p>
          <p className="text-xs text-white/60">{health.score} / 100</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {health.signals.map((signal) => (
          <div
            key={signal.label}
            className={`rounded-2xl border px-3 py-2 text-xs ${TONE_STYLE[signal.tone]}`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
              {signal.label}
            </p>
            <p className="mt-1 font-mono text-base text-white">{signal.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
