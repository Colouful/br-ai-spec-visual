"use client";

import type {
  RunAgentCollaborationVm,
  RunRuntimeResultItemVm,
  RunRuntimeResultsVm,
} from "@/lib/view-models/runtime-observability";

function StatusPill({ status, blocking }: { status: string; blocking?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] ${
        blocking
          ? "border-rose-300/50 bg-rose-300/10 text-rose-100"
          : "border-white/10 bg-white/5 text-white/70"
      }`}
    >
      {status}
    </span>
  );
}

function ResultList({
  title,
  items,
}: {
  title: string;
  items: RunRuntimeResultItemVm[];
}) {
  return (
    <section className="rounded-[18px] border border-white/8 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <span className="font-mono text-[11px] text-white/45">{items.length}</span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-white/45">暂无结构化结果</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-white">{item.label}</span>
                <StatusPill status={item.status} blocking={item.blocking} />
              </div>
              <p className="mt-1 text-xs leading-5 text-white/60">{item.summary}</p>
              {item.meta ? (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  {item.meta}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function RunRuntimeResultsPanel({ results }: { results: RunRuntimeResultsVm }) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,15,25,0.96),rgba(13,21,34,0.86))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            结果复盘
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Hook / Test / Repair / Review
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <StatusPill status={results.finalStatus} blocking={results.blockerCount > 0} />
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/60">
            阻塞项 {results.blockerCount}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/60">
            最大修复次数 {results.maxRepairAttempts}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultList title="Hook 结果" items={results.hookResults} />
        <ResultList title="Test 结果" items={results.testResults} />
        <ResultList title="Repair 结果" items={results.repairResults} />
        <ResultList title="Review 结果" items={results.reviewResults} />
      </div>
      {results.changedFiles.length > 0 ? (
        <div className="mt-3">
          <ResultList title="变更文件摘要" items={results.changedFiles} />
        </div>
      ) : null}
    </div>
  );
}

export function RunAgentCollaborationPanel({
  collaboration,
}: {
  collaboration: RunAgentCollaborationVm;
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
            协作轨迹
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">Agent 协作</h3>
          <p className="mt-1 text-sm text-white/60">{collaboration.summary}</p>
        </div>
        <StatusPill status={collaboration.finalDecision} blocking={collaboration.finalDecision === "blocked"} />
      </div>
      <ol className="mt-4 space-y-2 border-l border-white/10 pl-4">
        {collaboration.items.length === 0 ? (
          <li className="text-sm text-white/45">暂无 Agent 协作节点</li>
        ) : (
          collaboration.items.map((item) => (
            <li key={item.id} className="relative rounded-2xl border border-white/8 bg-black/20 px-3 py-2">
              <span className="absolute -left-[21px] top-4 flex h-6 w-6 items-center justify-center rounded-full border border-lime-300/40 bg-lime-300/10 font-mono text-[10px] text-lime-100">
                {item.order}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{item.role}</span>
                <StatusPill status={item.status} blocking={item.status === "blocked"} />
              </div>
              <p className="mt-1 text-xs leading-5 text-white/55">输入：{item.inputSummary}</p>
              <p className="text-xs leading-5 text-white/65">输出：{item.outputSummary}</p>
            </li>
          ))
        )}
      </ol>
      {collaboration.conflicts.length > 0 || collaboration.humanGates.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
            <p className="text-xs font-medium text-amber-100">冲突或争议</p>
            <p className="mt-1 text-xs text-amber-50/70">
              {collaboration.conflicts.join("；") || "无"}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
            <p className="text-xs font-medium text-cyan-100">人工门禁</p>
            <p className="mt-1 text-xs text-cyan-50/70">
              {collaboration.humanGates.join("；") || "无"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
