import { getDemoConsoleData } from "@/lib/demo/console-data";
import { getWorkspaceReadModel, listWorkspaceReadModels } from "@/lib/services/read-model";
import {
  formatCompactNumber,
  formatNameList,
  formatPercent,
  formatRelativeTime,
} from "@/lib/view-models/formatters";
import { getStatusBadge } from "@/lib/view-models/status";
import type { MetricVm, PageHeroVm, StatusKey } from "@/lib/view-models/types";
import {
  buildWorkspaceCardFromApiItem,
  buildWorkspaceHealthBands,
  buildWorkspaceOnboardingBands,
} from "@/lib/view-models/workspaces-shared";
import { computeWorkspaceHealth, type WorkspaceHealthBreakdown } from "@/lib/view-models/workspace-health";
import { buildWorkspaceOnboardingVm, type WorkspaceOnboardingVm } from "@/lib/view-models/workspace-integration";

export interface WorkspaceCardVm {
  id: string;
  slug: string;
  name: string;
  description: string;
  zone: string;
  badge: ReturnType<typeof getStatusBadge>;
  owners: string;
  projectCount: string;
  throughput: string;
  successRate: string;
  activeRuns: number;
  openChanges: number;
  lastActivity: string;
  focus: string;
  tags: string[];
  onboardingStageKey: string;
  onboardingStageLabel: string;
  onboardingScore: number;
}

export interface WorkspacesPageVm {
  hero: PageHeroVm;
  healthBands: MetricVm[];
  onboardingBands: MetricVm[];
  workspaces: WorkspaceCardVm[];
}

export interface WorkspaceDetailVm {
  hero: PageHeroVm;
  workspace: WorkspaceCardVm;
  health: WorkspaceHealthBreakdown;
  onboarding: WorkspaceOnboardingVm;
  metrics: MetricVm[];
  recentRuns: Array<{
    id: string;
    title: string;
    status: ReturnType<typeof getStatusBadge>;
    updatedAt: string;
    summary: string;
  }>;
  openChanges: Array<{
    id: string;
    title: string;
    status: ReturnType<typeof getStatusBadge>;
    owner: string;
    updatedAt: string;
  }>;
}

function mapRealWorkspaceCard(
  workspace: Awaited<ReturnType<typeof listWorkspaceReadModels>>[number],
  now: Date,
  timeZone: string,
): WorkspaceCardVm {
  return buildWorkspaceCardFromApiItem(
    {
      ...workspace,
      health: workspace.health as StatusKey,
      tags: workspace.tags.filter((tag: string | null): tag is string => Boolean(tag)),
    },
    now,
    timeZone,
  );
}

async function createDemoWorkspaceCard(workspaceId: string, now: Date, timeZone: string) {
  const data = await getDemoConsoleData();
  const demoWorkspace = data.workspaces.find((item) => item.id === workspaceId);
  if (!demoWorkspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  const workspaceRuns = data.runs.filter((run) => run.workspaceId === demoWorkspace.id);
  const workspaceChanges = data.changes.filter((change) => change.workspaceId === demoWorkspace.id);
  const lastActivity = workspaceRuns
    .map((run) => run.updatedAt)
    .concat(workspaceChanges.map((change) => change.updatedAt))
    .sort()
    .at(-1);

  return {
    id: demoWorkspace.id,
    slug: demoWorkspace.id,
    name: demoWorkspace.name,
    description: demoWorkspace.description,
    zone: demoWorkspace.zone,
    badge: getStatusBadge(demoWorkspace.health),
    owners: formatNameList(demoWorkspace.owners),
    projectCount: String(demoWorkspace.projectCount),
    throughput: formatCompactNumber(demoWorkspace.throughput),
    successRate: formatPercent(demoWorkspace.successRate),
    activeRuns: workspaceRuns.filter((run) => ["running", "queued"].includes(run.status)).length,
    openChanges: workspaceChanges.filter((change) => change.status !== "merged").length,
    lastActivity: lastActivity
      ? formatRelativeTime(lastActivity, { now, timeZone })
      : "No activity",
    focus: demoWorkspace.focus,
    tags: demoWorkspace.tags,
    onboardingStageKey: workspaceRuns.some((run) => run.status === "completed")
      ? "archived"
      : workspaceRuns.length > 0
        ? "run-ready"
        : "not-connected",
    onboardingStageLabel: workspaceRuns.some((run) => run.status === "completed")
      ? "已归档"
      : workspaceRuns.length > 0
        ? "已跑通需求"
        : "未接入",
    onboardingScore: workspaceRuns.some((run) => run.status === "completed")
      ? 56
      : workspaceRuns.length > 0
        ? 28
        : 0,
  } satisfies WorkspaceCardVm;
}

export async function getWorkspacesPageVm(timeZone = "Asia/Shanghai"): Promise<WorkspacesPageVm> {
  const realWorkspaces = await listWorkspaceReadModels();
  if (realWorkspaces.length > 0) {
    const now = new Date();
    const workspaces = realWorkspaces.map((workspace: Awaited<ReturnType<typeof listWorkspaceReadModels>>[number]) =>
      mapRealWorkspaceCard(workspace, now, timeZone),
    );

    return {
      hero: {
        eyebrow: "工作区",
        title: "把关键工作区、运行态与异常边界放在同一张台面上",
        subtitle:
          "当前页面优先显示 MySQL 里的工作区、运行态和文档索引；数据库为空时才退回演示数据。",
        stats: [
          { label: "工作区", value: String(workspaces.length) },
          { label: "活跃运行", value: String(workspaces.reduce((sum, item) => sum + item.activeRuns, 0)) },
          { label: "进行中变更", value: String(workspaces.reduce((sum, item) => sum + item.openChanges, 0)) },
        ],
      },
      healthBands: buildWorkspaceHealthBands(realWorkspaces.map((item) => item.health as StatusKey)),
      onboardingBands: buildWorkspaceOnboardingBands(
        workspaces.map((workspace) => workspace.onboardingStageKey),
      ),
      workspaces,
    };
  }

  const data = await getDemoConsoleData();
  const now = new Date(data.now);
  const workspaces = await Promise.all(
    data.workspaces.map((workspace: (typeof data.workspaces)[number]) =>
      createDemoWorkspaceCard(workspace.id, now, timeZone),
    ),
  );

  return {
    hero: {
      eyebrow: "工作区",
      title: "把关键工作区、运行态与异常边界放在同一张台面上",
      subtitle:
        "每个工作区先由服务端拼好概要数据，再把实时压力只留给局部运行部件，避免整页过度客户端化。",
      stats: [
        { label: "工作区", value: String(workspaces.length) },
        { label: "活跃运行", value: String(workspaces.reduce((sum, item) => sum + item.activeRuns, 0)) },
        { label: "进行中变更", value: String(workspaces.reduce((sum, item) => sum + item.openChanges, 0)) },
      ],
    },
    healthBands: buildWorkspaceHealthBands(data.workspaces.map((item) => item.health)),
    onboardingBands: buildWorkspaceOnboardingBands(
      workspaces.map((workspace) => workspace.onboardingStageKey),
    ),
    workspaces,
  };
}

export async function getWorkspaceDetailVm(
  workspaceId: string,
  timeZone = "Asia/Shanghai",
): Promise<WorkspaceDetailVm | null> {
  const workspaceRecord = await getWorkspaceReadModel(workspaceId);
  if (workspaceRecord) {
    const now = new Date();
    const health = await computeWorkspaceHealth(workspaceId);
    const onboarding = buildWorkspaceOnboardingVm({
      workspaceName: workspaceRecord.name,
      rootPath: workspaceRecord.rootPath,
      runCount: workspaceRecord._count.runStates,
      archiveCount: workspaceRecord.changeDocuments.filter((change) => {
        const normalizedStatus = String(change.status || "").toLowerCase();
        return Boolean(change.archivedAt) || ["archived", "merged", "completed"].includes(normalizedStatus);
      }).length,
    });
    const workspace = mapRealWorkspaceCard(
      {
        id: workspaceRecord.id,
        slug: workspaceRecord.slug,
        name: workspaceRecord.name,
        description: workspaceRecord.description || "已接入 BR AI Spec Visual 的工作区。",
        rootPath: workspaceRecord.rootPath,
        zone: workspaceRecord.rootPath || workspaceRecord.slug,
        health:
          workspaceRecord._count.alerts > 0
            ? "warning"
            : workspaceRecord._count.runStates > 0
              ? "healthy"
              : "idle",
        owners: workspaceRecord.members
          .map((member) => member.user?.name || member.user?.email)
          .filter(Boolean),
        projectCount: Math.max(1, workspaceRecord._count.registryItems),
        throughput: workspaceRecord._count.runStates + workspaceRecord._count.changeDocuments,
        successRate:
          workspaceRecord._count.runStates === 0
            ? 1
            : 1 - workspaceRecord._count.alerts / Math.max(workspaceRecord._count.runStates, 1),
        activeRuns: workspaceRecord._count.runStates,
        openChanges: workspaceRecord._count.changeDocuments,
        lastActivityAt:
          workspaceRecord.runStates[0]?.lastOccurredAt?.toISOString() ||
          workspaceRecord.updatedAt.toISOString(),
        focus: workspaceRecord.runStates[0]?.lastEventType || "等待实时事件更新",
        tags: [workspaceRecord.status, workspaceRecord._count.registryItems > 0 ? "registry" : "empty"],
        onboardingStageKey: onboarding.stage.key,
        onboardingStageLabel: onboarding.stage.label,
        onboardingScore: onboarding.score,
      },
      now,
      timeZone,
    );

    return {
      hero: {
        eyebrow: workspace.zone,
        title: workspace.name,
        subtitle: workspace.description,
        stats: [
          { label: "项目数", value: workspace.projectCount },
          { label: "吞吐量", value: workspace.throughput },
          { label: "成功率", value: workspace.successRate },
        ],
      },
      workspace,
      health,
      onboarding,
      metrics: [
        { label: "成员", value: String(workspaceRecord.members.length), note: workspace.owners },
        { label: "最新事件", value: workspaceRecord.runStates[0]?.lastEventType || "暂无运行事件" },
        { label: "项目路径", value: workspaceRecord.rootPath || "N/A" },
      ],
      recentRuns: workspaceRecord.runStates.map((runState) => ({
        id: runState.runKey,
        title: runState.runKey,
        status: getStatusBadge(
          (runState.status === "completed"
            ? "completed"
            : runState.status === "failed"
              ? "failed"
              : "running") as StatusKey,
        ),
        updatedAt: formatRelativeTime(runState.lastOccurredAt, { now, timeZone }),
        summary: runState.lastEventType,
      })),
      openChanges: workspaceRecord.changeDocuments.map((change) => ({
        id: `${change.changeKey}__${change.docType}`,
        title: change.title || `${change.changeKey} / ${change.docType}`,
        status: getStatusBadge(
          (change.status === "completed"
            ? "approved"
            : change.status === "failed"
              ? "blocked"
              : "review") as StatusKey,
        ),
        owner: "system",
        updatedAt: formatRelativeTime(change.updatedAt, { now, timeZone }),
      })),
    };
  }

  const data = await getDemoConsoleData();
  const now = new Date(data.now);
  const demoWorkspace = data.workspaces.find((item) => item.id === workspaceId);
  if (!demoWorkspace) {
    return null;
  }

  const workspace = await createDemoWorkspaceCard(demoWorkspace.id, now, timeZone);
  const workspaceRuns = data.runs.filter((run) => run.workspaceId === demoWorkspace.id);
  const workspaceChanges = data.changes.filter((change) => change.workspaceId === demoWorkspace.id);
  const recentRuns = data.runs
    .filter((run) => run.workspaceId === demoWorkspace.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((run) => ({
      id: run.id,
      title: run.title,
      status: getStatusBadge(run.status),
      updatedAt: formatRelativeTime(run.updatedAt, { now, timeZone }),
      summary: run.summary,
    }));
  const openChanges = data.changes
    .filter((change) => change.workspaceId === demoWorkspace.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((change) => ({
      id: change.id,
      title: change.title,
      status: getStatusBadge(change.status),
      owner: change.owner,
      updatedAt: formatRelativeTime(change.updatedAt, { now, timeZone }),
    }));

  return {
    hero: {
      eyebrow: demoWorkspace.zone,
      title: demoWorkspace.name,
      subtitle: demoWorkspace.description,
      stats: [
        { label: "项目数", value: workspace.projectCount },
        { label: "吞吐量", value: workspace.throughput },
        { label: "成功率", value: workspace.successRate },
      ],
    },
    workspace,
    health: {
      score: demoWorkspace.health === "healthy" ? 90 : demoWorkspace.health === "warning" ? 70 : 55,
      grade: demoWorkspace.health === "healthy" ? "A" : demoWorkspace.health === "warning" ? "B" : "C",
      totals: {
        runs: workspaceRuns.length,
        archivedRuns: workspaceRuns.filter((run) => run.status === "completed").length,
        pendingGates: 0,
        openAlerts: demoWorkspace.health === "warning" ? 1 : 0,
        activeChanges: workspaceChanges.filter((change) => change.status !== "merged").length,
        receivedReceipts: 0,
      },
      signals: [
        { label: "未关闭告警", value: demoWorkspace.health === "warning" ? "1" : "0", tone: demoWorkspace.health === "warning" ? "warn" : "good" },
        { label: "待审关卡(Gate)", value: "0", tone: "good" },
        { label: "发件箱(Outbox) 积压", value: "0", tone: "good" },
        { label: "24小时控制回执", value: "0", tone: "warn" },
        { label: "24小时归档事件", value: String(workspaceRuns.filter((run) => run.status === "completed").length), tone: workspaceRuns.some((run) => run.status === "completed") ? "good" : "warn" },
        { label: "活跃变更", value: String(workspaceChanges.filter((change) => change.status !== "merged").length), tone: workspaceChanges.some((change) => change.status !== "merged") ? "good" : "warn" },
      ],
    },
    onboarding: buildWorkspaceOnboardingVm({
      workspaceName: demoWorkspace.name,
      rootPath: null,
      runCount: workspaceRuns.length,
      archiveCount: workspaceRuns.filter((run) => run.status === "completed").length,
    }),
    metrics: [
      { label: "成员", value: demoWorkspace.owners.length.toString(), note: workspace.owners },
      { label: "当前关注点", value: demoWorkspace.focus, note: "可直接替换成真实 API 的诊断摘要" },
      { label: "标签", value: demoWorkspace.tags.join(" · ") },
    ],
    recentRuns,
    openChanges,
  };
}
