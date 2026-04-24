import type { Prisma } from "@prisma/client";

import { ensureDemoWorkspaceSeedData, ensureSeededUsers } from "@/lib/db/bootstrap";
import { prisma } from "@/lib/db/prisma";
import { buildWorkspaceOnboardingVm } from "@/lib/view-models/workspace-integration";

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapWorkspaceHealth(input: {
  status: string;
  alertCount: number;
  runCount: number;
}) {
  if (input.alertCount > 0) return "warning";
  if (input.runCount === 0) return "idle";
  if (input.status !== "active") return "warning";
  return "healthy";
}

function mapRunStatus(status: string | null | undefined) {
  switch (status) {
    case "success":
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "queued":
    case "planned":
    case "observed":
      return "queued";
    default:
      return "running";
  }
}

function summarizeRunPayload(payload: Prisma.JsonValue | null | undefined) {
  const record = asRecord(payload);
  const trigger = asRecord(record["trigger"] as Prisma.JsonValue | undefined);
  const task = asRecord(record["task"] as Prisma.JsonValue | undefined);
  const flow = asRecord(record["flow"] as Prisma.JsonValue | undefined);

  return {
    title:
      asString(task.change_id) ||
      asString(trigger.raw_input) ||
      asString(flow.name) ||
      "Runtime event",
    trigger:
      [asString(trigger.source), asString(trigger.entry)]
        .filter(Boolean)
        .join(" / ") || "runtime-state",
    operator:
      asString(record.current_role) ||
      asString(record.pending_gate) ||
      "system",
    summary:
      asString(trigger.raw_input) ||
      asString(flow.name) ||
      "来自运行状态桥接的实时同步结果。",
    changeId: asString(task.change_id) || undefined,
  };
}

export async function ensureReadModelBootstrap() {
  await ensureSeededUsers();
  await ensureDemoWorkspaceSeedData();
}

export async function listWorkspaceReadModels() {
  await ensureReadModelBootstrap();

  const [items, archivedRows] = await Promise.all([
    prisma.workspace.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            runStates: true,
            changeDocuments: true,
            alerts: true,
            registryItems: true,
          },
        },
        members: {
          include: {
            user: true,
          },
          take: 4,
        },
        runStates: {
          orderBy: {
            lastOccurredAt: "desc",
          },
          take: 1,
        },
      },
    }),
    prisma.changeDocument.groupBy({
      by: ["workspaceId"],
      where: {
        OR: [
          { archivedAt: { not: null } },
          { status: { in: ["archived", "merged", "completed"] } },
        ],
      },
      _count: { _all: true },
    }),
  ]);

  const archivedCountMap = new Map(
    archivedRows.map((row) => [row.workspaceId, row._count._all]),
  );

  return items.map((workspace) => ({
    ...(() => {
      const onboarding = buildWorkspaceOnboardingVm({
        workspaceName: workspace.name,
        rootPath: workspace.rootPath,
        runCount: workspace._count.runStates,
        archiveCount: archivedCountMap.get(workspace.id) ?? 0,
      });
      return {
        onboardingStageKey: onboarding.stage.key,
        onboardingStageLabel: onboarding.stage.label,
        onboardingScore: onboarding.score,
      };
    })(),
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    description:
      workspace.description ||
      "已接入 BR AI Spec Visual 的工作区。",
    rootPath: workspace.rootPath,
    zone: workspace.rootPath || workspace.slug,
    health: mapWorkspaceHealth({
      status: workspace.status,
      alertCount: workspace._count.alerts,
      runCount: workspace._count.runStates,
    }),
    owners:
      workspace.members
        .map((member) => member.user?.name || member.user?.email)
        .filter(Boolean) || [],
    projectCount: Math.max(1, workspace._count.registryItems),
    throughput: workspace._count.runStates + workspace._count.changeDocuments,
    successRate: workspace._count.runStates === 0
      ? 1
      : 1 - workspace._count.alerts / Math.max(workspace._count.runStates, 1),
    tags: [
      workspace.status,
      workspace._count.registryItems > 0 ? "registry" : null,
      workspace._count.changeDocuments > 0 ? "changes" : null,
    ].filter(Boolean),
    focus:
      workspace.runStates[0]?.lastEventType ||
      "等待采集器写入运行态",
    lastActivityAt:
      workspace.runStates[0]?.lastOccurredAt?.toISOString() ||
      workspace.updatedAt.toISOString(),
    activeRuns: workspace._count.runStates,
    openChanges: workspace._count.changeDocuments,
  }));
}

export async function getWorkspaceReadModel(workspaceId: string) {
  await ensureReadModelBootstrap();

  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: {
          runStates: true,
          changeDocuments: true,
          alerts: true,
          registryItems: true,
        },
      },
      members: {
        include: {
          user: true,
        },
      },
      runStates: {
        orderBy: {
          lastOccurredAt: "desc",
        },
        take: 8,
      },
      changeDocuments: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 8,
      },
    },
  });
}

export async function listRunReadModels() {
  await ensureReadModelBootstrap();

  const states = await prisma.runState.findMany({
    orderBy: {
      lastOccurredAt: "desc",
    },
    include: {
      workspace: true,
    },
  });
  const runEvents = await prisma.runEvent.findMany({
    orderBy: {
      occurredAt: "desc",
    },
  });
  const eventsByRunKey = new Map<string, Array<{
    id: string;
    runKey: string;
    eventType: string;
    occurredAt: Date;
    payload: Prisma.JsonValue | null;
  }>>();
  for (const event of runEvents) {
    const list = eventsByRunKey.get(event.runKey) ?? [];
    list.push(event);
    eventsByRunKey.set(event.runKey, list);
  }

  return states.map((item) => {
    const summary = summarizeRunPayload(item.payload);
    const events = (eventsByRunKey.get(item.runKey) ?? []).slice(0, 12);
    return {
      id: item.runKey,
      workspaceId: item.workspaceId,
      workspaceName: item.workspace?.name || item.workspaceId,
      status: mapRunStatus(item.status),
      lastEventType: item.lastEventType,
      lastOccurredAt: item.lastOccurredAt.toISOString(),
      turnCount: item.turnCount,
      events: events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        payload: asRecord(event.payload),
      })),
      ...summary,
    };
  });
}

export async function getRunReadModel(runId: string) {
  await ensureReadModelBootstrap();

  const item = await prisma.runState.findFirst({
    where: { runKey: runId },
    include: {
      workspace: true,
    },
  });
  if (!item) {
    return null;
  }
  const runEvents = await prisma.runEvent.findMany({
    where: { runKey: runId },
    orderBy: {
      occurredAt: "asc",
    },
  });

  return {
    ...item,
    runEvents,
  };
}

export async function listChangeReadModels() {
  await ensureReadModelBootstrap();

  const items = await prisma.changeDocument.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      workspace: true,
    },
  });

  return items.map((item) => {
    const payload = asRecord(item.payload);
    return {
      id: item.id,
      displayId: `${item.changeKey}__${item.docType}`,
      changeKey: item.changeKey,
      docType: item.docType,
      title: item.title || `${item.changeKey} / ${item.docType}`,
      workspaceId: item.workspaceId,
      workspaceName: item.workspace?.name || item.workspaceId,
      workspaceSlug: item.workspace?.slug || item.workspaceId,
      summary: `${item.docType} → ${item.sourcePath}`,
      status: item.status || "draft",
      owner: asString(payload.current_role) || "system",
      reviewers: Array.isArray(payload.required_roles)
        ? payload.required_roles.filter((entry) => typeof entry === "string")
        : [],
      systems: [
        item.docType,
        asString(payload.flow_id) || null,
      ].filter(Boolean),
      runIds: [],
      updatedAt: item.updatedAt.toISOString(),
      sourcePath: item.sourcePath,
    };
  });
}

export async function listMemberReadModels() {
  await ensureReadModelBootstrap();

  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
      },
      sessions: true,
    },
  });

  return users.map((user) => {
    const workspaces = user.memberships
      .map((membership) => membership.workspace)
      .filter(Boolean)
      .map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        role: user.role,
        updatedAt: workspace.updatedAt.toISOString(),
      }));

    const lastActivityAt = workspaces
      .map((workspace) => workspace.updatedAt)
      .sort()
      .at(-1) || user.updatedAt.toISOString();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceCount: workspaces.length,
      workspaces,
      sessionCount: user.sessions.length,
      lastActivityAt,
    };
  });
}

export async function listSpecReadModels() {
  const changes = await listChangeReadModels();
  return changes.map((change) => ({
    id: change.id,
    changeKey: change.changeKey,
    docType: change.docType,
    title: change.title,
    workspaceId: change.workspaceId,
    workspaceName: change.workspaceName,
    status: change.status,
    owner: change.owner,
    updatedAt: change.updatedAt,
    sourcePath: change.sourcePath,
    summary: change.summary,
    systems: change.systems,
  }));
}

export async function listTaskReadModels() {
  const [runs, changes] = await Promise.all([listRunReadModels(), listChangeReadModels()]);

  const runTasks = runs.map((run) => ({
    id: `run:${run.id}`,
    sourceId: run.id,
    kind: "run",
    title: run.title,
    workspaceId: run.workspaceId,
    workspaceName: run.workspaceName,
    status: run.status,
    owner: run.operator,
    updatedAt: run.lastOccurredAt,
    summary: run.summary,
    linkHref: `/runs/${run.id}`,
    meta: run.trigger,
  }));

  const changeTasks = changes.map((change) => ({
    id: `change:${change.id}`,
    sourceId: change.id,
    kind: "change",
    title: change.title,
    workspaceId: change.workspaceId,
    workspaceName: change.workspaceName,
    status: change.status,
    owner: change.owner,
    updatedAt: change.updatedAt,
    summary: change.summary,
    linkHref: `/changes/${change.id}`,
    meta: change.docType,
  }));

  return [...runTasks, ...changeTasks].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}
