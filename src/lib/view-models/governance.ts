import { getStatusBadge } from "@/lib/view-models/status";
import type { PageHeroVm } from "@/lib/view-models/types";

export interface GovernanceWorkspaceSource {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  updatedAt: string;
  currentRoleCode: string | null;
  currentRoleNameZh: string | null;
  activeChanges: string[];
  waitingReviewChanges: string[];
  pendingArchiveChanges: string[];
  archivedChanges: string[];
  specAssets: Array<{
    sourceKind: "openspec" | "ai-spec-history";
    updatedAt: string;
  }>;
  hasBlockingGate: boolean;
  registrySource: "hub-sync" | "local-fallback" | "seed" | "missing";
  registryVersion: number | null;
  registryUpdatedAt: string | null;
}

export interface GovernanceMetrics {
  activeProjects: number;
  activeChanges: number;
  waitingReviewChanges: number;
  pendingArchiveChanges: number;
  archivedChanges: number;
  archiveSuccessRate: number;
  weeklyNewAssets: number;
  historyTasks: number;
}

export interface GovernanceWorkspaceCard {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  currentRoleNameZh: string | null;
  currentRoleCode: string | null;
  activeChanges: number;
  pendingArchiveChanges: number;
  archivedChanges: number;
  specAssetCount: number;
  historyTaskCount: number;
  health: "healthy" | "warning";
  updatedAt: string;
  registrySource: "hub-sync" | "local-fallback" | "seed" | "missing";
  registryVersion: number | null;
  registryUpdatedAt: string | null;
}

export interface GovernanceSummary {
  hero: PageHeroVm;
  metrics: GovernanceMetrics;
  workspaceCards: GovernanceWorkspaceCard[];
}

export interface WorkspaceGovernanceViewModel extends GovernanceSummary {
  workspaceCard: GovernanceWorkspaceCard | null;
}

function uniqueCount(values: string[][]) {
  return new Set(values.flat()).size;
}

function startOfWeek(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return date;
}

export function buildGovernanceSummary(
  workspaces: GovernanceWorkspaceSource[],
  now = new Date("2026-04-24T12:00:00.000Z"),
): GovernanceSummary {
  const weekStart = startOfWeek(now);
  const metrics: GovernanceMetrics = {
    activeProjects: workspaces.length,
    activeChanges: uniqueCount(workspaces.map((workspace) => workspace.activeChanges)),
    waitingReviewChanges: uniqueCount(
      workspaces.map((workspace) => workspace.waitingReviewChanges),
    ),
    pendingArchiveChanges: uniqueCount(
      workspaces.map((workspace) => workspace.pendingArchiveChanges),
    ),
    archivedChanges: uniqueCount(workspaces.map((workspace) => workspace.archivedChanges)),
    archiveSuccessRate: 0,
    weeklyNewAssets: workspaces.reduce(
      (count, workspace) =>
        count +
        workspace.specAssets.filter(
          (asset) => new Date(asset.updatedAt).getTime() >= weekStart.getTime(),
        ).length,
      0,
    ),
    historyTasks: workspaces.reduce(
      (count, workspace) =>
        count +
        workspace.specAssets.filter((asset) => asset.sourceKind === "ai-spec-history")
          .length,
      0,
    ),
  };

  metrics.archiveSuccessRate =
    metrics.archivedChanges /
    Math.max(metrics.archivedChanges + metrics.pendingArchiveChanges, 1);

  const workspaceCards = [...workspaces]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )
    .map((workspace) => ({
      workspaceId: workspace.workspaceId,
      workspaceSlug: workspace.workspaceSlug,
      workspaceName: workspace.workspaceName,
      currentRoleNameZh: workspace.currentRoleNameZh,
      currentRoleCode: workspace.currentRoleCode,
      activeChanges: new Set(workspace.activeChanges).size,
      pendingArchiveChanges: new Set(workspace.pendingArchiveChanges).size,
      archivedChanges: new Set(workspace.archivedChanges).size,
      specAssetCount: workspace.specAssets.filter(
        (asset) => asset.sourceKind === "openspec",
      ).length,
      historyTaskCount: workspace.specAssets.filter(
        (asset) => asset.sourceKind === "ai-spec-history",
      ).length,
      health: (workspace.hasBlockingGate ? "warning" : "healthy") as
        | "healthy"
        | "warning",
      updatedAt: workspace.updatedAt,
      registrySource: workspace.registrySource,
      registryVersion: workspace.registryVersion,
      registryUpdatedAt: workspace.registryUpdatedAt,
    }));

  return {
    hero: {
      eyebrow: "OpenSpec 治理",
      title: "多项目 OpenSpec 治理驾驶舱",
      subtitle: "聚焦活跃 Change、待评审、待归档和资产沉淀，回答规范流程是否真正跑起来。",
      stats: [
        { label: "活跃项目", value: String(metrics.activeProjects) },
        { label: "活跃 Change", value: String(metrics.activeChanges) },
        { label: "待评审", value: String(metrics.waitingReviewChanges) },
        { label: "待归档", value: String(metrics.pendingArchiveChanges) },
        { label: "已归档", value: String(metrics.archivedChanges) },
        { label: "轻量历史", value: String(metrics.historyTasks) },
      ],
    },
    metrics,
    workspaceCards,
  };
}

export function toGovernanceHealthBadge(health: "healthy" | "warning") {
  return getStatusBadge(health === "healthy" ? "healthy" : "warning");
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

async function loadRoleName(input: {
  workspaceId: string;
  rootPath: string | null;
  roleCode: string | null;
}) {
  if (!input.roleCode) return null;

  const [{ prisma }, { parseRegistryFile }, { readFile }, pathModule] =
    await Promise.all([
      import("@/lib/db/prisma"),
      import("@/lib/ingest/registry"),
      import("node:fs/promises"),
      import("node:path"),
    ]);

  const dbRole = await prisma.registryItem.findFirst({
    where: {
      workspaceId: input.workspaceId,
      category: "role",
      slug: input.roleCode,
    },
  });
  if (dbRole) return dbRole.name;

  if (!input.rootPath) return input.roleCode;

  try {
    const rolePath = pathModule.resolve(input.rootPath, ".agents/registry/roles.json");
    const content = await readFile(rolePath, "utf8");
    const registry = parseRegistryFile({
      filePath: ".agents/registry/roles.json",
      content,
    });
    return (
      registry.items.find(
        (item) => item.category === "role" && item.slug === input.roleCode,
      )?.name ?? input.roleCode
    );
  } catch {
    return input.roleCode;
  }
}

async function detectRegistrySource(input: {
  workspaceId: string;
  rootPath: string | null;
}): Promise<{
  source: "hub-sync" | "local-fallback" | "seed" | "missing";
  version: number | null;
  updatedAt: string | null;
}> {
  const [{ prisma }, fsModule, pathModule] = await Promise.all([
    import("@/lib/db/prisma"),
    import("node:fs/promises"),
    import("node:path"),
  ]);

  const registryItems = await prisma.registryItem.findMany({
    where: {
      workspaceId: input.workspaceId,
      category: { in: ["flow", "role"] },
    },
    select: {
      version: true,
      updatedAt: true,
    },
  });

  if (registryItems.length > 0) {
    const registryRawEventCount = await prisma.rawIngestEvent.count({
      where: {
        workspaceId: input.workspaceId,
        sourceType: "registry-json",
      },
    });
    return {
      source: registryRawEventCount > 0 ? "hub-sync" : "seed",
      version: Math.max(...registryItems.map((item) => item.version)),
      updatedAt: registryItems
        .map((item) => item.updatedAt)
        .sort((left, right) => right.getTime() - left.getTime())[0]
        ?.toISOString() ?? null,
    };
  }

  if (input.rootPath) {
    try {
      await fsModule.access(pathModule.resolve(input.rootPath, ".agents/registry"));
      return {
        source: "local-fallback" as const,
        version: null,
        updatedAt: null,
      };
    } catch {
      // ignore
    }
  }

  return {
    source: "missing" as const,
    version: null,
    updatedAt: null,
  };
}

export async function getGovernanceSummaryViewModel() {
  const [{ prisma }, { syncWorkspaceSpecAssets }] = await Promise.all([
    import("@/lib/db/prisma"),
    import("@/lib/spec-assets"),
  ]);

  const workspaces = await prisma.workspace.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      rootPath: true,
      updatedAt: true,
    },
  });

  const sources = await Promise.all(
    workspaces.map(async (workspace) => {
      const [specAssets, runStates, gates, changeDocuments] = await Promise.all([
        syncWorkspaceSpecAssets({
          workspaceId: workspace.id,
          rootPath: workspace.rootPath,
        }),
        prisma.runState.findMany({
          where: { workspaceId: workspace.id },
          orderBy: { lastOccurredAt: "desc" },
          take: 8,
        }),
        prisma.gateApproval.findMany({
          where: { workspaceId: workspace.id },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.changeDocument.findMany({
          where: { workspaceId: workspace.id },
          orderBy: { updatedAt: "desc" },
        }),
      ]);
      const registryInfo = await detectRegistrySource({
        workspaceId: workspace.id,
        rootPath: workspace.rootPath,
      });

      const currentRun =
        runStates.find(
          (run) =>
            !["completed", "success", "cancelled", "canceled"].includes(
              String(run.status || ""),
            ),
        ) ?? runStates[0] ?? null;
      const currentPayload = asRecord(currentRun?.payload);
      const currentRoleCode = asString(currentPayload.current_role) || null;
      const currentRoleNameZh = await loadRoleName({
        workspaceId: workspace.id,
        rootPath: workspace.rootPath,
        roleCode: currentRoleCode,
      });

      const openChangeIds = new Set<string>();
      const archivedChangeIds = new Set<string>();
      for (const change of changeDocuments) {
        if (change.archivedAt || ["archived", "merged", "completed"].includes(String(change.status || ""))) {
          archivedChangeIds.add(change.changeKey);
        } else {
          openChangeIds.add(change.changeKey);
        }
      }
      const pendingArchiveChanges = new Set<string>();
      const archiveChangeIds = new Set<string>();
      for (const asset of specAssets) {
        if (asset.changeId && asset.sourceKind === "openspec") {
          if (asset.assetType === "archive") {
            archiveChangeIds.add(asset.changeId);
            archivedChangeIds.add(asset.changeId);
            pendingArchiveChanges.delete(asset.changeId);
          } else {
            pendingArchiveChanges.add(asset.changeId);
          }
        }
      }
      for (const archivedId of archiveChangeIds) {
        pendingArchiveChanges.delete(archivedId);
      }

      const waitingReviewChanges = new Set<string>();
      for (const gate of gates) {
        if (gate.status === "waiting-approval") {
          const relatedRun = runStates.find((run) => run.runKey === gate.runId);
          const changeId = asString(
            asRecord(asRecord(relatedRun?.payload).task).change_id,
          );
          if (changeId) {
            waitingReviewChanges.add(changeId);
          }
        }
      }
      for (const change of changeDocuments) {
        if (String(change.status || "") === "review") {
          waitingReviewChanges.add(change.changeKey);
        }
      }

      return {
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        workspaceName: workspace.name,
        updatedAt: workspace.updatedAt.toISOString(),
        currentRoleCode,
        currentRoleNameZh,
        activeChanges: [...openChangeIds],
        waitingReviewChanges: [...waitingReviewChanges],
        pendingArchiveChanges: [...pendingArchiveChanges],
        archivedChanges: [...archivedChangeIds],
        specAssets: specAssets.map((asset) => ({
          sourceKind: asset.sourceKind as "openspec" | "ai-spec-history",
          updatedAt: asset.updatedAt ?? workspace.updatedAt.toISOString(),
        })),
        hasBlockingGate: gates.some((gate) =>
          ["waiting-approval", "rejected"].includes(gate.status),
        ),
        registrySource: registryInfo.source,
        registryVersion: registryInfo.version,
        registryUpdatedAt: registryInfo.updatedAt,
      } satisfies GovernanceWorkspaceSource;
    }),
  );

  return buildGovernanceSummary(sources, new Date());
}

export async function getWorkspaceGovernanceViewModel(input: {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  rootPath: string | null;
}): Promise<WorkspaceGovernanceViewModel> {
  const summary = await getGovernanceSummaryViewModel();
  const current = summary.workspaceCards.find(
    (card) => card.workspaceId === input.workspaceId,
  );
  return {
    ...summary,
    hero: {
      eyebrow: `${input.workspaceName} · OpenSpec 治理`,
      title: "单项目治理详情",
      subtitle: "聚焦当前专家、待评审、待归档、资产健康与最近运行，查看单项目规范流程闭环。",
      stats: [
        { label: "活跃 Change", value: String(current?.activeChanges ?? 0) },
        {
          label: "待归档",
          value: String(current?.pendingArchiveChanges ?? 0),
        },
        { label: "已归档", value: String(current?.archivedChanges ?? 0) },
        { label: "规范资产", value: String(current?.specAssetCount ?? 0) },
        { label: "轻量历史", value: String(current?.historyTaskCount ?? 0) },
      ],
    },
    workspaceCard: current ?? null,
  };
}
