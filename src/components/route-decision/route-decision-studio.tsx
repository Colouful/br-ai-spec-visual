"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import type { RouteDecisionPageVm } from "@/lib/view-models/route-decision";
import {
  evaluateRouteDecision,
  type RouteDecisionChangeContext,
  type RouteDecisionInput,
} from "@/lib/view-models/route-decision-shared";

type WorkspaceOption = RouteDecisionPageVm["workspaces"][number];

const CONTEXT_OPTIONS: Array<{
  key: RouteDecisionChangeContext;
  label: string;
  description: string;
}> = [
  {
    key: "no-change",
    label: "全新需求 / 新开任务",
    description: "还没有复用中的 change(变更)，需要先判断是 quick-fix(轻量快修) 还是 full-change(完整变更)。",
  },
  {
    key: "active-run",
    label: "当前 active run(活跃运行) 内继续修正",
    description: "运行还在推进中，通常是 patch(补丁修正) 或 scope-delta(范围增量)。",
  },
  {
    key: "open-change",
    label: "当前 open change(未归档变更) 内继续修正",
    description: "已经有未归档 change(变更)，判断是 patch(补丁修正) 还是 scope-delta(范围增量)。",
  },
  {
    key: "before-archive",
    label: "归档前修正",
    description: "准备归档时发现实现 / 验收不对，需要先回退修正。",
  },
  {
    key: "archived-change",
    label: "已归档内容补修",
    description: "原变更已经归档，当前应新开 followup-patch(归档后补丁)。",
  },
];

function inferInitialContext(workspace: WorkspaceOption | undefined): RouteDecisionChangeContext {
  if (!workspace) return "no-change";
  if (workspace.pendingArchiveGateCount > 0) return "before-archive";
  if (workspace.openChangeCount > 0) return "open-change";
  return "no-change";
}

function buildInitialInput(workspace: WorkspaceOption | undefined): RouteDecisionInput {
  return {
    workspaceName: workspace?.name ?? "未选择工作区",
    changeContext: inferInitialContext(workspace),
    activeRunCount: workspace?.activeRunCount ?? 0,
    openChangeCount: workspace?.openChangeCount ?? 0,
    archivedChangeCount: workspace?.archivedChangeCount ?? 0,
    hasExplicitTargetChange: false,
    lowRisk: false,
    styleOrCopyOnly: false,
    createPageOrMock: false,
    addsApi: false,
    addsRoute: false,
    addsStore: false,
    crossModule: false,
    requiresTrace: false,
    changesScope: false,
    reviewConclusionChanged: false,
    securityOrCompliance: false,
  };
}

function resolveInitialWorkspace(
  workspaces: WorkspaceOption[],
  preferredWorkspace: string | null | undefined,
  fallbackWorkspace: WorkspaceOption | undefined,
) {
  if (!preferredWorkspace) {
    return fallbackWorkspace;
  }

  return (
    workspaces.find(
      (workspace) =>
        workspace.slug === preferredWorkspace || workspace.id === preferredWorkspace,
    ) ?? fallbackWorkspace
  );
}

export function RouteDecisionStudio({
  viewModel,
  initialWorkspace,
}: {
  viewModel: RouteDecisionPageVm;
  initialWorkspace?: string | null;
}) {
  const defaultWorkspace = useMemo(
    () =>
      viewModel.workspaces.find(
        (workspace) => workspace.slug === viewModel.defaultWorkspaceSlug,
      ) ?? viewModel.workspaces[0],
    [viewModel.defaultWorkspaceSlug, viewModel.workspaces],
  );
  const preferredWorkspace = useMemo(
    () =>
      resolveInitialWorkspace(
        viewModel.workspaces,
        initialWorkspace,
        defaultWorkspace,
      ),
    [defaultWorkspace, initialWorkspace, viewModel.workspaces],
  );

  const [selectedWorkspaceSlug, setSelectedWorkspaceSlug] = useState(
    preferredWorkspace?.slug ?? "",
  );
  const selectedWorkspace = useMemo(
    () =>
      viewModel.workspaces.find((workspace) => workspace.slug === selectedWorkspaceSlug) ??
      preferredWorkspace,
    [preferredWorkspace, selectedWorkspaceSlug, viewModel.workspaces],
  );

  const [input, setInput] = useState<RouteDecisionInput>(
    buildInitialInput(preferredWorkspace),
  );

  useEffect(() => {
    queueMicrotask(() => {
      setInput((current) => ({
        ...current,
        workspaceName: selectedWorkspace?.name ?? "未选择工作区",
        activeRunCount: selectedWorkspace?.activeRunCount ?? 0,
        openChangeCount: selectedWorkspace?.openChangeCount ?? 0,
        archivedChangeCount: selectedWorkspace?.archivedChangeCount ?? 0,
        changeContext:
          current.changeContext === "no-change"
            ? inferInitialContext(selectedWorkspace)
            : current.changeContext,
      }));
    });
  }, [selectedWorkspace]);

  const deferredInput = useDeferredValue(input);
  const result = useMemo(
    () => evaluateRouteDecision(deferredInput),
    [deferredInput],
  );

  const workspaceStats = selectedWorkspace ?? {
    activeRunCount: 0,
    openChangeCount: 0,
    archivedChangeCount: 0,
    pendingArchiveGateCount: 0,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-panel space-y-5 rounded-[28px] p-6">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            Route Decision 分流决策器
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            先判断这次改动属于哪条链，再决定命令和下一步
          </h2>
          <p className="text-sm leading-7 text-slate-400">
            这里不是重新发明规则，而是把 `br-ai-spec(规范 CLI 项目)` 已有的分流语义可视化出来。你只需要先回答当前上下文和改动边界，系统就会给出推荐流转路径、命令提示和风险说明。
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">工作区</span>
          <select
            value={selectedWorkspaceSlug}
            onChange={(event) => setSelectedWorkspaceSlug(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/30"
          >
            {viewModel.workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.slug}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="active run 活跃运行" value={workspaceStats.activeRunCount} />
          <StatCard label="open change 未归档变更" value={workspaceStats.openChangeCount} />
          <StatCard label="archived change 已归档变更" value={workspaceStats.archivedChangeCount} />
          <StatCard label="before-archive 门禁" value={workspaceStats.pendingArchiveGateCount} />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-200">当前上下文</p>
          <div className="grid gap-3">
            {CONTEXT_OPTIONS.map((option) => {
              const active = input.changeContext === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    setInput((current) => ({ ...current, changeContext: option.key }))
                  }
                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-cyan-300/28 bg-cyan-300/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-200">改动特征</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckItem
              checked={input.lowRisk}
              label="low-risk 低风险"
              note="单点修正，预期回归面很小。"
              onChange={(checked) => setInput((current) => ({ ...current, lowRisk: checked }))}
            />
            <CheckItem
              checked={input.styleOrCopyOnly}
              label="style/copy 样式文案"
              note="主要是样式、文案或轻交互。"
              onChange={(checked) => setInput((current) => ({ ...current, styleOrCopyOnly: checked }))}
            />
            <CheckItem
              checked={input.createPageOrMock}
              label="page/mock 新建页面"
              note="新建页面、mock 页面、演示版页面搭建。"
              onChange={(checked) => setInput((current) => ({ ...current, createPageOrMock: checked }))}
            />
            <CheckItem
              checked={input.addsApi}
              label="API 接口变化"
              note="新增或调整真实 API 接口。"
              onChange={(checked) => setInput((current) => ({ ...current, addsApi: checked }))}
            />
            <CheckItem
              checked={input.addsRoute}
              label="route 路由变化"
              note="新增路由或改页面入口关系。"
              onChange={(checked) => setInput((current) => ({ ...current, addsRoute: checked }))}
            />
            <CheckItem
              checked={input.addsStore}
              label="store 状态变化"
              note="新增 store(状态管理) 或全局状态。"
              onChange={(checked) => setInput((current) => ({ ...current, addsStore: checked }))}
            />
            <CheckItem
              checked={input.crossModule}
              label="cross-module 跨模块"
              note="明显跨模块联动，不再是单点修正。"
              onChange={(checked) => setInput((current) => ({ ...current, crossModule: checked }))}
            />
            <CheckItem
              checked={input.requiresTrace}
              label="trace/spec 需要留痕"
              note="需要长期归档、评审或 spec(规范文档) 留痕。"
              onChange={(checked) => setInput((current) => ({ ...current, requiresTrace: checked }))}
            />
            <CheckItem
              checked={input.changesScope}
              label="scope-delta 范围变化"
              note="影响范围、接口边界或验收口径。"
              onChange={(checked) => setInput((current) => ({ ...current, changesScope: checked }))}
            />
            <CheckItem
              checked={input.reviewConclusionChanged}
              label="review 评审结论变化"
              note="主要影响守门判断或归档前结论。"
              onChange={(checked) => setInput((current) => ({ ...current, reviewConclusionChanged: checked }))}
            />
            <CheckItem
              checked={input.securityOrCompliance}
              label="security/compliance 高风险"
              note="权限、支付、风控、合规等高风险逻辑。"
              onChange={(checked) => setInput((current) => ({ ...current, securityOrCompliance: checked }))}
            />
            <CheckItem
              checked={input.hasExplicitTargetChange}
              label="target 已明确目标 change"
              note="多个未归档 change 并存时，你已经明确本次要复用哪一个。"
              onChange={(checked) =>
                setInput((current) => ({ ...current, hasExplicitTargetChange: checked }))
              }
            />
          </div>
        </div>
      </section>

      <section className="glass-panel space-y-5 rounded-[28px] p-6">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            Result 决策结果
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {result.routeDecision}
          </h2>
          <p className="text-sm leading-7 text-slate-300">{result.summary}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard label="selected flow 流程" value={result.selectedFlow ?? "待确认"} />
          <ResultCard label="trace mode 留痕模式" value={result.traceMode ?? "待确认"} />
          <ResultCard label="next expert 下一专家" value={result.nextExpert ?? "无需预设"} />
          <ResultCard label="trace location 留痕位置" value={result.traceLocation} />
        </div>

        <div className="rounded-[24px] border border-cyan-300/16 bg-cyan-300/8 px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">
            推荐命令与话术
          </p>
          <p className="mt-3 text-sm font-medium text-white">
            {result.recommendedCommand}
          </p>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-black/30 px-4 py-4 text-sm leading-6 text-slate-200">
{result.exampleInput}
          </pre>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">为什么推荐这条链</p>
            <ul className="space-y-2">
              {result.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300"
                >
                  {reason}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">需要注意的风险</p>
            {result.warnings.length === 0 ? (
              <div className="rounded-[18px] border border-emerald-400/16 bg-emerald-400/8 px-4 py-4 text-sm leading-6 text-emerald-100">
                当前没有明显上下文冲突，可以直接按推荐路径继续。
              </div>
            ) : (
              <ul className="space-y-2">
                {result.warnings.map((warning) => (
                  <li
                    key={warning}
                    className="rounded-[18px] border border-amber-400/16 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-100"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-white">{value}</p>
    </div>
  );
}

function CheckItem({
  checked,
  label,
  note,
  onChange,
}: {
  checked: boolean;
  label: string;
  note: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-white/18 hover:bg-white/[0.05]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-cyan-300 focus:ring-cyan-300/40"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-400">{note}</span>
      </span>
    </label>
  );
}
