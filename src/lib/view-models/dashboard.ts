import { prisma } from "@/lib/db/prisma";
import { ensureReadModelBootstrap } from "@/lib/services/read-model";
import { getInstallationsStats } from "@/lib/services/installations-query";
import { getStatusBadge } from "@/lib/view-models/status";
import { formatDuration, formatPercent, formatRelativeTime } from "@/lib/view-models/formatters";
import type { MetricVm, PageHeroVm } from "@/lib/view-models/types";
import {
  findWorkspaceBySlugOrId,
  resolveDefaultWorkspaceSlug,
} from "@/lib/workspace-context/server";
import {
  calculateAssetCompletionScore,
  resolveBlockerReason,
  type DashboardAssetCheckVm,
  type OnboardingStageVm,
} from "./dashboard-shared";
import {
  buildWorkspaceOnboardingVm,
  detectWorkspaceAssets,
} from "./workspace-integration";

export interface DashboardOnboardingVm {
  workspaceName: string;
  workspaceSlug: string | null;
  workspaceRootPath: string | null;
  stage: OnboardingStageVm;
  nextAction: string;
  nextActionHint: string;
  score: number;
  assets: DashboardAssetCheckVm[];
}

export interface DashboardBlockerVm {
  id: string;
  workspaceName: string;
  runKey: string;
  statusLabel: string;
  reason: string;
  updatedAt: string;
  href: string;
}

export interface DashboardListItemVm {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  updatedAt: string;
  href: string;
  badge: ReturnType<typeof getStatusBadge>;
}

export interface DashboardPilotWorkspaceVm {
  id: string;
  slug: string;
  name: string;
  summary: string;
  lastActivity: string;
  archivedCount: number;
  activeRuns: number;
  openChanges: number;
  badge: ReturnType<typeof getStatusBadge>;
}

export interface DashboardVm {
  hero: PageHeroVm;
  onboarding: DashboardOnboardingVm;
  healthMetrics: MetricVm[];
  deliveryMetrics: MetricVm[];
  efficiencyMetrics: MetricVm[];
  adoptionMetrics: MetricVm[];
  assetMetrics: MetricVm[];
  blockers: DashboardBlockerVm[];
  recentRuns: DashboardListItemVm[];
  recentChanges: DashboardListItemVm[];
  pilotWorkspaces: DashboardPilotWorkspaceVm[];
  defaultWorkspaceSlug: string | null;
  demoWorkspaceSlug: string | null;
}

function toRunStatusKey(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "completed":
    case "success":
    case "archived":
      return "completed" as const;
    case "failed":
      return "failed" as const;
    case "cancelled":
    case "canceled":
      return "canceled" as const;
    case "queued":
    case "planned":
    case "observed":
      return "queued" as const;
    default:
      return "running" as const;
  }
}

function toChangeStatusKey(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "completed":
    case "approved":
      return "approved" as const;
    case "merged":
    case "archived":
      return "merged" as const;
    case "failed":
    case "blocked":
      return "blocked" as const;
    case "review":
    case "guardian":
    case "awaiting_review":
      return "review" as const;
    default:
      return "draft" as const;
  }
}

function startOfToday(now: Date) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(now: Date) {
  const date = startOfToday(now);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return date;
}

async function getAverageArchiveDurationMs() {
  try {
    const completedRuns = await prisma.runState.findMany({
      where: {
        status: { in: ["completed", "success", "archived"] },
      },
      orderBy: { lastOccurredAt: "desc" },
      take: 30,
      select: { runKey: true },
    });

    if (completedRuns.length === 0) {
      return null;
    }

    const runKeys = completedRuns.map((run) => run.runKey);
    const events = await prisma.runEvent.findMany({
      where: {
        runKey: { in: runKeys },
      },
      orderBy: { occurredAt: "asc" },
      select: { runKey: true, occurredAt: true },
    });

    const range = new Map<string, { start: Date; end: Date }>();
    for (const event of events) {
      const existing = range.get(event.runKey);
      if (!existing) {
        range.set(event.runKey, { start: event.occurredAt, end: event.occurredAt });
        continue;
      }
      if (event.occurredAt < existing.start) {
        existing.start = event.occurredAt;
      }
      if (event.occurredAt > existing.end) {
        existing.end = event.occurredAt;
      }
    }

    const durations = [...range.values()]
      .map(({ start, end }) => end.getTime() - start.getTime())
      .filter((duration) => duration > 0);

    if (durations.length === 0) {
      return null;
    }

    return Math.round(
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
    );
  } catch {
    return null;
  }
}

async function getInstallationsStatsSafe() {
  try {
    return await getInstallationsStats();
  } catch {
    return {
      totalInstallations: 0,
      totalProjects: 0,
      totalEvents: 0,
      dau: 0,
      wau: 0,
      mau: 0,
      eventsToday: 0,
      commandDistribution: [],
      statusDistribution: [],
      platformDistribution: [],
      cliVersionDistribution: [],
      profileDistribution: [],
      dailyActive: [],
      newProjectsLast7d: 0,
      newProjectsLast30d: 0,
    };
  }
}

export async function getDashboardVm(
  timeZone = "Asia/Shanghai",
): Promise<DashboardVm> {
  await ensureReadModelBootstrap();

  const now = new Date();
  const startToday = startOfToday(now);
  const startWeek = startOfWeek(now);

  const [
    defaultWorkspaceSlug,
    workspaces,
    recentRuns,
    recentChanges,
    openAlerts,
    latestRunEvent,
    installStats,
    archivedByWorkspace,
    startedToday,
    archivedToday,
    startedThisWeek,
    archivedThisWeek,
    averageArchiveDurationMs,
  ] = await Promise.all([
    resolveDefaultWorkspaceSlug(),
    prisma.workspace.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            runStates: true,
            changeDocuments: true,
            registryItems: true,
            alerts: true,
          },
        },
        runStates: {
          orderBy: { lastOccurredAt: "desc" },
          take: 1,
        },
      },
      take: 12,
    }),
    prisma.runState.findMany({
      orderBy: { lastOccurredAt: "desc" },
      take: 6,
      include: {
        workspace: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.changeDocument.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        workspace: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.alert.count({
      where: { status: "open" },
    }),
    prisma.runEvent.findFirst({
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true },
    }),
    getInstallationsStatsSafe(),
    prisma.runEvent.groupBy({
      by: ["workspaceId"],
      where: { eventType: { contains: "archived" } },
      _count: { _all: true },
    }),
    prisma.runState.count({
      where: { createdAt: { gte: startToday } },
    }),
    prisma.runEvent.count({
      where: {
        eventType: { contains: "archived" },
        occurredAt: { gte: startToday },
      },
    }),
    prisma.runState.count({
      where: { createdAt: { gte: startWeek } },
    }),
    prisma.runEvent.count({
      where: {
        eventType: { contains: "archived" },
        occurredAt: { gte: startWeek },
      },
    }),
    getAverageArchiveDurationMs(),
  ]);

  const defaultWorkspace = defaultWorkspaceSlug
    ? await findWorkspaceBySlugOrId(defaultWorkspaceSlug)
    : null;

  const archivedByWorkspaceMap = new Map(
    archivedByWorkspace.map((item) => [item.workspaceId, item._count._all]),
  );

  const defaultWorkspaceDetail = defaultWorkspace
    ? workspaces.find((workspace) => workspace.id === defaultWorkspace.id) ?? null
    : null;

  const assetSnapshot = detectWorkspaceAssets(defaultWorkspace?.rootPath ?? null);
  const defaultArchiveCount = defaultWorkspace
    ? archivedByWorkspaceMap.get(defaultWorkspace.id) ?? 0
    : 0;
  const onboarding = buildWorkspaceOnboardingVm({
    workspaceName: defaultWorkspace?.name ?? "尚未选择工作区",
    rootPath: defaultWorkspace?.rootPath ?? null,
    runCount: defaultWorkspaceDetail?._count.runStates ?? 0,
    archiveCount: defaultArchiveCount,
  });

  const totalActiveRuns = workspaces.reduce(
    (sum, workspace) => sum + workspace._count.runStates,
    0,
  );
  const activeWorkspaces = workspaces.filter(
    (workspace) => workspace._count.runStates > 0,
  ).length;
  const pilotWorkspaces = workspaces.filter(
    (workspace) =>
      workspace._count.runStates > 0 || workspace._count.changeDocuments > 0,
  );
  const blockCandidates = recentRuns.filter((run) => {
    const payload =
      run.payload && typeof run.payload === "object" && !Array.isArray(run.payload)
        ? (run.payload as Record<string, unknown>)
        : {};
    const pendingGate =
      typeof payload.pending_gate === "string" ? payload.pending_gate : null;
    return (
      Boolean(pendingGate) ||
      String(run.status || "").toLowerCase() === "failed" ||
      run.lastEventType.toLowerCase().includes("gate") ||
      run.lastEventType.toLowerCase().includes("failed")
    );
  });

  return {
    hero: {
      eyebrow: "交付驾驶舱",
      title: "把接入状态、运行态、阻塞点与闭环结果放在同一屏",
      subtitle:
        "首页先回答三个问题：有没有接入成功、当前卡在哪、最近有没有形成真实需求闭环。Base(规范底座) 侧保持切面接入，Visual(可视化端) 侧负责把这些事实收敛出来。",
      stats: [
        { label: "工作区", value: String(workspaces.length) },
        { label: "活跃运行", value: String(totalActiveRuns) },
        { label: "今日归档", value: String(archivedToday) },
        { label: "累计安装", value: String(installStats.totalInstallations) },
      ],
    },
    onboarding: {
      ...onboarding,
      workspaceSlug: defaultWorkspace?.slug ?? null,
    },
    healthMetrics: [
      { label: "运行中 Run", value: String(totalActiveRuns) },
      { label: "异常告警", value: String(openAlerts) },
      { label: "活跃工作区", value: String(activeWorkspaces) },
      {
        label: "最近上报",
        value: latestRunEvent?.occurredAt
          ? formatRelativeTime(latestRunEvent.occurredAt, { now, timeZone })
          : "暂无",
      },
    ],
    deliveryMetrics: [
      { label: "今日发起需求", value: String(startedToday) },
      { label: "今日归档", value: String(archivedToday) },
      {
        label: "本周闭环率",
        value:
          startedThisWeek > 0
            ? formatPercent(archivedThisWeek / startedThisWeek)
            : "--",
      },
      { label: "试点工作区", value: String(pilotWorkspaces.length) },
    ],
    efficiencyMetrics: [
      {
        label: "平均闭环时长",
        value: averageArchiveDurationMs
          ? formatDuration(averageArchiveDurationMs)
          : "--",
        note: "按已完成或已归档 run(运行) 的事件跨度估算。",
      },
      { label: "周活安装", value: String(installStats.wau) },
      { label: "近 7 天新增项目", value: String(installStats.newProjectsLast7d) },
      { label: "今日命令事件", value: String(installStats.eventsToday) },
    ],
    adoptionMetrics: [
      { label: "累计安装", value: String(installStats.totalInstallations) },
      { label: "累计项目", value: String(installStats.totalProjects) },
      { label: "日活安装", value: String(installStats.dau) },
      { label: "月活安装", value: String(installStats.mau) },
    ],
    assetMetrics: [
      {
        label: "资产完整度",
        value: `${calculateAssetCompletionScore(assetSnapshot)}%`,
        note: "按 rules / skills / OpenSpec / .ai-spec / registry / logs / bridge 七项检测。",
      },
      {
        label: "registry 条目",
        value: String(defaultWorkspaceDetail?._count.registryItems ?? 0),
      },
      {
        label: "运行态快照",
        value: String(defaultWorkspaceDetail?._count.runStates ?? 0),
      },
      {
        label: "变更文档",
        value: String(defaultWorkspaceDetail?._count.changeDocuments ?? 0),
      },
    ],
    blockers: blockCandidates.slice(0, 5).map((run) => {
      const payload =
        run.payload && typeof run.payload === "object" && !Array.isArray(run.payload)
          ? (run.payload as Record<string, unknown>)
          : {};
      const pendingGate =
        typeof payload.pending_gate === "string" ? payload.pending_gate : null;
      return {
        id: run.id,
        workspaceName: run.workspace?.name ?? run.workspaceId,
        runKey: run.runKey,
        statusLabel: getStatusBadge(toRunStatusKey(run.status)).label,
        reason: resolveBlockerReason({
          pendingGate,
          lastEventType: run.lastEventType,
          status: String(run.status || ""),
        }),
        updatedAt: formatRelativeTime(run.lastOccurredAt, { now, timeZone }),
        href: `/w/${encodeURIComponent(
          run.workspace?.slug ?? run.workspaceId,
        )}/runs/${encodeURIComponent(run.runKey)}`,
      };
    }),
    recentRuns: recentRuns.map((run) => ({
      id: run.id,
      title: run.runKey,
      subtitle: run.workspace?.name ?? run.workspaceId,
      meta: run.lastEventType,
      updatedAt: formatRelativeTime(run.lastOccurredAt, { now, timeZone }),
      href: `/w/${encodeURIComponent(
        run.workspace?.slug ?? run.workspaceId,
      )}/runs/${encodeURIComponent(run.runKey)}`,
      badge: getStatusBadge(toRunStatusKey(run.status)),
    })),
    recentChanges: recentChanges.map((change) => ({
      id: change.id,
      title: change.title || `${change.changeKey} / ${change.docType}`,
      subtitle: change.workspace?.name ?? change.workspaceId,
      meta: `change · ${change.docType}`,
      updatedAt: formatRelativeTime(change.updatedAt, { now, timeZone }),
      href: `/w/${encodeURIComponent(
        change.workspace?.slug ?? change.workspaceId,
      )}/pipeline`,
      badge: getStatusBadge(toChangeStatusKey(change.status)),
    })),
    pilotWorkspaces: pilotWorkspaces.slice(0, 4).map((workspace) => ({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      summary:
        workspace.runStates[0]?.lastEventType || "等待下一条运行态事件上报",
      lastActivity: formatRelativeTime(
        workspace.runStates[0]?.lastOccurredAt ?? workspace.updatedAt,
        {
          now,
          timeZone,
        },
      ),
      archivedCount: archivedByWorkspaceMap.get(workspace.id) ?? 0,
      activeRuns: workspace._count.runStates,
      openChanges: workspace._count.changeDocuments,
      badge: getStatusBadge(
        workspace._count.alerts > 0
          ? "warning"
          : workspace._count.runStates > 0
            ? "healthy"
            : "idle",
      ),
    })),
    defaultWorkspaceSlug,
    demoWorkspaceSlug:
      workspaces.find((workspace) => /demo/i.test(workspace.slug))?.slug ?? null,
  };
}
