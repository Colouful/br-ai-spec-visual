import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { DashboardVm } from "@/lib/view-models/dashboard";
import type { MetricVm } from "@/lib/view-models/types";

function stageClass(stage: DashboardVm["onboarding"]["stage"]["key"]) {
  switch (stage) {
    case "archived":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
    case "run-ready":
      return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
    case "visual-ready":
      return "border-sky-400/25 bg-sky-400/10 text-sky-100";
    case "base-ready":
      return "border-amber-400/25 bg-amber-400/10 text-amber-100";
    case "not-connected":
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function MetricList({ items }: { items: MetricVm[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {item.value}
          </p>
          {item.note ? (
            <p className="mt-2 text-xs leading-6 text-slate-400">{item.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PlatformCockpit({ viewModel }: { viewModel: DashboardVm }) {
  return (
    <div className="space-y-6">
      <Panel
        title="Onboarding 报告"
        eyebrow="首条成功路径"
        className="overflow-visible"
      >
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] ${stageClass(viewModel.onboarding.stage.key)}`}
              >
                {viewModel.onboarding.stage.label}
              </span>
              <span className="text-sm text-slate-400">
                当前工作区：<span className="text-slate-100">{viewModel.onboarding.workspaceName}</span>
              </span>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              {viewModel.onboarding.stage.detail}
            </p>
            <div className="rounded-[22px] border border-cyan-400/12 bg-cyan-400/6 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-200/80">
                下一步推荐
              </p>
              <p className="mt-2 text-base font-medium text-white">
                {viewModel.onboarding.nextAction}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {viewModel.onboarding.nextActionHint}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {viewModel.onboarding.assets.map((asset) => (
                <div
                  key={asset.key}
                  className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
                    {asset.label}
                  </p>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      asset.detected ? "text-emerald-200" : "text-slate-400"
                    }`}
                  >
                    {asset.detected ? "已检测" : "未检测"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                资产完整度
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-4xl font-semibold tracking-tight text-white">
                  {viewModel.onboarding.score}%
                </p>
                <p className="pb-1 text-sm text-slate-400">
                  规则 / 技能 / OpenSpec / 运行态 / 注册表 / 日志 / Bridge
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  style={{ width: `${viewModel.onboarding.score}%` }}
                />
              </div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                快捷入口
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/workspaces"
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
                >
                  查看工作区
                </Link>
                <Link
                  href="/route-decision"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
                >
                  打开分流决策器
                </Link>
                {viewModel.defaultWorkspaceSlug ? (
                  <Link
                    href={`/w/${encodeURIComponent(viewModel.defaultWorkspaceSlug)}/pipeline`}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
                  >
                    打开默认工作区主线
                  </Link>
                ) : null}
                {viewModel.demoWorkspaceSlug ? (
                  <Link
                    href={`/w/${encodeURIComponent(viewModel.demoWorkspaceSlug)}/pipeline`}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
                  >
                    打开 Demo Workspace
                  </Link>
                ) : null}
              </div>
              {viewModel.onboarding.workspaceRootPath ? (
                <p className="mt-4 break-all text-xs leading-6 text-slate-500">
                  rootPath(项目根路径)：{viewModel.onboarding.workspaceRootPath}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="运行态健康度" eyebrow="RunState">
          <MetricList items={viewModel.healthMetrics} />
        </Panel>
        <Panel title="阻塞变化流" eyebrow="Blockers">
          <div className="space-y-3">
            {viewModel.blockers.length === 0 ? (
              <p className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                当前没有明显阻塞，说明至少没有 run(运行) 卡在门禁或失败状态。
              </p>
            ) : (
              viewModel.blockers.map((blocker) => (
                <Link
                  key={blocker.id}
                  href={blocker.href}
                  className="block rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-amber-300/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{blocker.runKey}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {blocker.workspaceName} · {blocker.updatedAt}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-300">
                      {blocker.statusLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {blocker.reason}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Panel>
        <Panel title="交付闭环进度" eyebrow="Delivery">
          <MetricList items={viewModel.deliveryMetrics} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="效率与采纳" eyebrow="Efficiency">
          <MetricList items={viewModel.efficiencyMetrics} />
        </Panel>
        <Panel title="规范资产命中情况" eyebrow="Assets">
          <MetricList items={viewModel.assetMetrics} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="最近 Runs" eyebrow="Recent Runs">
          <div className="space-y-3">
            {viewModel.recentRuns.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-cyan-300/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.subtitle} · {item.updatedAt}
                    </p>
                  </div>
                  <StatusBadge badge={item.badge} compact />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.meta}</p>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="最近 Changes / Specs" eyebrow="Recent Changes">
          <div className="space-y-3">
            {viewModel.recentChanges.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.subtitle} · {item.updatedAt}
                    </p>
                  </div>
                  <StatusBadge badge={item.badge} compact />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.meta}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="安装与接入概览" eyebrow="Adoption">
          <MetricList items={viewModel.adoptionMetrics} />
        </Panel>
        <Panel title="试点项目专区" eyebrow="Pilot Workspaces">
          <div className="space-y-3">
            {viewModel.pilotWorkspaces.length === 0 ? (
              <p className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                当前还没有进入试点观察面的工作区。
              </p>
            ) : (
              viewModel.pilotWorkspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/w/${encodeURIComponent(workspace.slug)}/pipeline`}
                  className="block rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{workspace.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {workspace.lastActivity}
                      </p>
                    </div>
                    <StatusBadge badge={workspace.badge} compact />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {workspace.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{workspace.activeRuns} 个活跃运行</span>
                    <span>{workspace.openChanges} 个进行中变更</span>
                    <span>{workspace.archivedCount} 次归档记录</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
