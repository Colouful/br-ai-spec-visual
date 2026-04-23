import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import type { WorkspaceOnboardingVm } from "@/lib/view-models/workspace-integration";

function stageClass(stage: WorkspaceOnboardingVm["stage"]["key"]) {
  switch (stage) {
    case "archived":
      return "border-emerald-400/22 bg-emerald-400/10 text-emerald-100";
    case "run-ready":
      return "border-cyan-300/22 bg-cyan-300/10 text-cyan-100";
    case "visual-ready":
      return "border-sky-300/22 bg-sky-300/10 text-sky-100";
    case "base-ready":
      return "border-amber-300/22 bg-amber-300/10 text-amber-100";
    case "not-connected":
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

export function WorkspaceOnboardingCard({
  workspaceSlug,
  onboarding,
}: {
  workspaceSlug: string;
  onboarding: WorkspaceOnboardingVm;
}) {
  return (
    <Panel title="接入与 Onboarding 报告" eyebrow="Workspace Integration">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] ${stageClass(onboarding.stage.key)}`}
          >
            {onboarding.stage.label}
          </span>
          <span className="text-sm text-slate-400">
            资产完整度 <span className="text-slate-100">{onboarding.score}%</span>
          </span>
        </div>
        <p className="text-sm leading-7 text-slate-300">{onboarding.stage.detail}</p>
        <div className="rounded-[22px] border border-cyan-400/12 bg-cyan-400/6 px-4 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-200/80">
            下一步推荐
          </p>
          <p className="mt-2 text-base font-medium text-white">{onboarding.nextAction}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {onboarding.nextActionHint}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {onboarding.assets.map((asset) => (
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
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/w/${encodeURIComponent(workspaceSlug)}/pipeline`}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
          >
            打开工作区主线
          </Link>
          <Link
            href={`/route-decision?workspace=${encodeURIComponent(workspaceSlug)}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
          >
            打开分流决策
          </Link>
        </div>
        {onboarding.workspaceRootPath ? (
          <p className="break-all text-xs leading-6 text-slate-500">
            rootPath(项目根路径)：{onboarding.workspaceRootPath}
          </p>
        ) : (
          <p className="text-xs leading-6 text-slate-500">
            当前工作区没有记录 rootPath(项目根路径)，因此只能基于数据库态推断接入阶段。
          </p>
        )}
      </div>
    </Panel>
  );
}
