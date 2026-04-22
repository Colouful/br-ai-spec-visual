import Link from "next/link";

import {
  toStageDistribution,
  type PipelineCardVm,
  type PipelineColumnVm,
  type WorkspacePipelineVm,
} from "@/lib/view-models/pipeline";

interface PipelineBoardProps {
  workspaceName: string;
  vm: WorkspacePipelineVm;
}

export function PipelineBoard({ workspaceName, vm }: PipelineBoardProps) {
  const distribution = toStageDistribution(vm);
  const totals = Math.max(vm.totalCards, 1);

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
          {workspaceName} · Pipeline
        </p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          5 阶段流程主视图
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">
          Spec → Plan → Run → Review → Archive。Change 走规范与计划；<strong className="font-medium text-slate-300">Run
          列</strong>展示的是从自动机侧同步的<strong className="font-medium text-slate-300">运行实例</strong>，与
          &ldquo;当前是否有一条需求在写&rdquo; 不是同一张表，二者可以单独为空。
        </p>
        {vm.hiddenStaleRuns > 0 ? (
          <p className="max-w-3xl text-xs leading-6 text-slate-500">
            有 {vm.hiddenStaleRuns} 条无终态且超过阈值的运行已从本看板<strong>隐藏</strong>（不替代
            <span className="font-mono text-slate-400"> run.archived</span> / 完成态推送；仅缓解历史脏数据）。
            在{" "}
            <Link
              className="text-cyan-300/90 underline decoration-cyan-500/40 underline-offset-2 hover:decoration-cyan-300/60"
              href={`/w/${encodeURIComponent(vm.workspaceSlug)}/runs`}
            >
              运行
            </Link>{" "}
            中仍可查看全部 <span className="font-mono">RunState</span> 记录。阈值由环境变量
            <span className="font-mono"> PIPELINE_STALE_RUN_MAX_AGE_HOURS</span> 控制（默认
            24h）。
          </p>
        ) : null}
      </header>

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <SummaryStat label="活跃运行" value={vm.activeRun} accent="text-amber-200" />
            <SummaryStat label="待评审" value={vm.pendingReview} accent="text-fuchsia-200" />
            <SummaryStat label="已归档" value={vm.totalArchive} accent="text-emerald-200" />
            <SummaryStat label="总卡片" value={vm.totalCards} accent="text-slate-100" />
          </div>
        </div>
        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-white/5">
          {distribution.map((seg) => {
            const pct = (seg.count / totals) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={seg.stage}
                title={`${seg.title} · ${seg.count}`}
                className={stageBarClass(seg.stage)}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
          {distribution.map((seg) => (
            <span key={seg.stage} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${stageDotClass(seg.stage)}`} />
              {seg.title} · {seg.count}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {vm.columns.map((column) => (
          <PipelineColumn key={column.id} column={column} />
        ))}
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-lg font-semibold ${accent}`}>{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function PipelineColumn({ column }: { column: PipelineColumnVm }) {
  return (
    <div className="glass-panel flex h-full flex-col rounded-2xl">
      <header
        className={`rounded-t-2xl border-b border-white/8 bg-gradient-to-br ${column.accent} px-4 py-3`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{column.title}</h2>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-mono text-slate-100">
            {column.cards.length}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-200/80">{column.description}</p>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {column.cards.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">该阶段暂无卡片</p>
        ) : (
          column.cards.map((card) => <PipelineCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

function PipelineCard({ card }: { card: PipelineCardVm }) {
  return (
    <Link
      href={card.href}
      className="group rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              card.kind === "run"
                ? "bg-amber-500/15 text-amber-200"
                : "bg-cyan-500/15 text-cyan-200"
            }`}
          >
            {card.kind}
          </span>
          {card.ownerRole ? (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
              {card.ownerRole}
            </span>
          ) : null}
        </div>
        <span className="text-[10px] text-slate-500">{card.lastActivityRelative}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-100 group-hover:text-white">
        {card.title}
      </p>
      <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">{card.subtitle}</p>
      {card.pendingGate ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] text-fuchsia-200">
          gate · {card.pendingGate}
        </p>
      ) : null}
    </Link>
  );
}

function stageBarClass(stage: string) {
  switch (stage) {
    case "spec":
      return "bg-cyan-400/70";
    case "plan":
      return "bg-indigo-400/70";
    case "run":
      return "bg-amber-400/80";
    case "review":
      return "bg-fuchsia-400/80";
    case "archive":
      return "bg-emerald-400/70";
    default:
      return "bg-slate-400/40";
  }
}

function stageDotClass(stage: string) {
  return stageBarClass(stage);
}
