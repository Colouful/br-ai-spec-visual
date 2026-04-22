import type { WorkspaceHealthBreakdown } from "@/lib/view-models/workspace-health";
import { cn } from "@/lib/utils";

const TONE_STYLE: Record<"good" | "warn" | "bad", string> = {
  good: "text-emerald-200/95 bg-emerald-500/12 border-emerald-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
  warn: "text-amber-200/95 bg-amber-500/12 border-amber-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
  bad: "text-rose-200/95 bg-rose-500/12 border-rose-400/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
};

const GRADE_STYLE: Record<WorkspaceHealthBreakdown["grade"], string> = {
  A: "from-emerald-400/90 to-cyan-300/80",
  B: "from-cyan-300/90 to-sky-400/75",
  C: "from-amber-300/90 to-orange-400/70",
  D: "from-rose-400/90 to-rose-500/75",
};

const GRADE_TEXT: Record<WorkspaceHealthBreakdown["grade"], string> = {
  A: "text-emerald-100",
  B: "text-cyan-100",
  C: "text-amber-100",
  D: "text-rose-100",
};

export function WorkspaceHealthCard({
  health,
  className,
}: {
  health: WorkspaceHealthBreakdown;
  className?: string;
}) {
  const scorePct = Math.max(0, Math.min(100, health.score));

  return (
    <section
      aria-label="工作区健康度"
      className={cn(
        "w-full overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(160deg,rgba(10,18,30,0.98),rgba(8,14,24,0.92))] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {/* 顶栏：全宽健康度摘要 */}
      <div className="relative border-b border-white/10 bg-[linear-gradient(90deg,rgba(14,24,38,0.7),rgba(8,20,32,0.4),rgba(10,30,40,0.5))] px-5 py-5 sm:px-7 sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mask-[linear-gradient(90deg,transparent,black_20%,black_80%,transparent)] opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 48px)",
          }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-cyan-300/85">
              工作区健康 · Workspace health
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                健康度评分
              </h2>
              <span className="text-sm text-white/45">
                综合运行、告警、关卡与发件箱压力
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-4 sm:gap-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br p-px shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] sm:h-18 sm:w-18 ${GRADE_STYLE[health.grade]}`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-[0.9rem] bg-zinc-950/90">
                <span
                  className={`font-mono text-3xl font-bold tabular-nums sm:text-4xl ${GRADE_TEXT[health.grade]}`}
                >
                  {health.grade}
                </span>
              </div>
            </div>
            <div>
              <p
                className="font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl"
                aria-label={`${health.score} 分，满分 100`}
              >
                {health.score}
                <span className="text-lg font-normal text-white/45 sm:text-xl">/100</span>
              </p>
              <p className="mt-0.5 text-[11px] text-white/50">实时聚合 · 每次打开看板重算</p>
            </div>
          </div>
        </div>

        <div
          className="relative mt-5 h-2 w-full overflow-hidden rounded-full bg-white/8 ring-1 ring-inset ring-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={health.score}
          aria-label="健康度分数条"
        >
          <div
            className={`h-full rounded-full bg-linear-to-r ${GRADE_STYLE[health.grade]}`}
            style={{ width: `${scorePct}%` }}
          />
        </div>
      </div>

      {/* 指标区：宽屏 6 列横排，窄屏逐渐折叠 */}
      <div className="p-4 sm:p-5">
        <p className="mb-3 px-1 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
          指标 · Signals
        </p>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {health.signals.map((signal) => (
            <li
              key={signal.label}
              className={`flex min-h-18 flex-col justify-between rounded-2xl border px-3 py-2.5 ${TONE_STYLE[signal.tone]}`}
            >
              <p className="line-clamp-2 font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.12em] opacity-85">
                {signal.label}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white sm:text-xl">
                {signal.value}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
