import Link from "next/link";

import { Card, CardEyebrow, CardHeader, CardTitle } from "@/components/ui/card";
import {
  toGovernanceHealthBadge,
  type GovernanceSummary,
  type WorkspaceGovernanceViewModel,
} from "@/lib/view-models/governance";
import { StatusBadge } from "@/components/dashboard/status-badge";

export function OpenSpecGovernanceDashboard({
  summary,
}: {
  summary: GovernanceSummary;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="活跃项目" value={String(summary.metrics.activeProjects)} />
        <MetricCard label="活跃 Change" value={String(summary.metrics.activeChanges)} />
        <MetricCard label="待评审" value={String(summary.metrics.waitingReviewChanges)} />
        <MetricCard label="待归档" value={String(summary.metrics.pendingArchiveChanges)} />
        <MetricCard label="已归档" value={String(summary.metrics.archivedChanges)} />
        <MetricCard
          label="归档成功率"
          value={`${Math.round(summary.metrics.archiveSuccessRate * 100)}%`}
        />
        <MetricCard label="本周新增资产" value={String(summary.metrics.weeklyNewAssets)} />
        <MetricCard label="轻量历史任务" value={String(summary.metrics.historyTasks)} />
      </section>

      <Card padding="lg">
        <CardHeader>
          <div>
            <CardEyebrow>OpenSpec 使用总览</CardEyebrow>
            <CardTitle>多项目治理总览</CardTitle>
          </div>
        </CardHeader>
        <div className="grid gap-4 xl:grid-cols-2">
          {summary.workspaceCards.map((card) => (
            <div
              key={card.workspaceId}
              className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{card.workspaceName}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    当前专家 · {card.currentRoleNameZh || "暂无活跃专家"}
                    {card.currentRoleCode ? ` / ${card.currentRoleCode}` : ""}
                  </p>
                </div>
                <StatusBadge badge={toGovernanceHealthBadge(card.health)} compact />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <GovernanceMiniStat label="活跃 Change" value={String(card.activeChanges)} />
                <GovernanceMiniStat
                  label="待归档"
                  value={String(card.pendingArchiveChanges)}
                />
                <GovernanceMiniStat label="已归档" value={String(card.archivedChanges)} />
                <GovernanceMiniStat label="正式资产" value={String(card.specAssetCount)} />
                <GovernanceMiniStat label="轻量历史" value={String(card.historyTaskCount)} />
                <GovernanceMiniStat
                  label="Registry 来源"
                  value={
                    card.registryVersion
                      ? `${card.registrySource} v${card.registryVersion}`
                      : card.registrySource
                  }
                />
                <GovernanceMiniStat
                  label="最近更新"
                  value={new Date(card.updatedAt).toLocaleDateString("zh-CN")}
                />
              </div>

              <div className="mt-5">
                <Link
                  href={`/w/${encodeURIComponent(card.workspaceSlug)}/admin`}
                  className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
                >
                  打开项目治理详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function WorkspaceGovernanceDashboard({
  summary,
}: {
  summary: WorkspaceGovernanceViewModel;
}) {
  return (
    <div className="space-y-6">
      {summary.workspaceCard ? (
        <Card padding="lg">
          <CardHeader>
            <div>
              <CardEyebrow>单项目治理</CardEyebrow>
              <CardTitle>{summary.workspaceCard.workspaceName}</CardTitle>
            </div>
          </CardHeader>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="当前专家"
              value={summary.workspaceCard.currentRoleNameZh || "暂无"}
            />
            <MetricCard
              label="活跃 Change"
              value={String(summary.workspaceCard.activeChanges)}
            />
            <MetricCard
              label="待归档"
              value={String(summary.workspaceCard.pendingArchiveChanges)}
            />
            <MetricCard
              label="已归档"
              value={String(summary.workspaceCard.archivedChanges)}
            />
            <MetricCard
              label="正式资产"
              value={String(summary.workspaceCard.specAssetCount)}
            />
            <MetricCard
              label="轻量历史"
              value={String(summary.workspaceCard.historyTaskCount)}
            />
            <MetricCard
              label="Registry 来源"
              value={
                summary.workspaceCard.registryVersion
                  ? `${summary.workspaceCard.registrySource} v${summary.workspaceCard.registryVersion}`
                  : summary.workspaceCard.registrySource
              }
            />
            <MetricCard
              label="Registry 时间"
              value={
                summary.workspaceCard.registryUpdatedAt
                  ? new Date(summary.workspaceCard.registryUpdatedAt).toLocaleDateString("zh-CN")
                  : "未同步"
              }
            />
          </div>
        </Card>
      ) : null}

      <Card padding="lg">
        <CardHeader>
          <div>
            <CardEyebrow>治理漏斗</CardEyebrow>
            <CardTitle>OpenSpec 闭环摘要</CardTitle>
          </div>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="待评审" value={String(summary.metrics.waitingReviewChanges)} />
          <MetricCard label="待归档" value={String(summary.metrics.pendingArchiveChanges)} />
          <MetricCard label="本周新增资产" value={String(summary.metrics.weeklyNewAssets)} />
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function GovernanceMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
