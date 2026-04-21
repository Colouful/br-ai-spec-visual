import { prisma } from "@/lib/db/prisma";
import { formatRelativeTime } from "@/lib/view-models/formatters";
import { computeWorkspaceHealth, type WorkspaceHealthBreakdown } from "@/lib/view-models/workspace-health";

export interface OverviewWorkspaceCard {
  id: string;
  name: string;
  health: WorkspaceHealthBreakdown;
}

export interface OverviewActiveRun {
  workspaceId: string;
  workspaceName: string;
  runKey: string;
  lastEventType: string;
  pendingGate: string | null;
  currentRole: string | null;
  lastOccurredAtRelative: string;
  status: string;
}

export interface OverviewArchiveEntry {
  id: string;
  workspaceId: string;
  workspaceName: string;
  runKey: string;
  occurredAt: string;
  occurredAtRelative: string;
  payloadSummary: string;
}

export interface OverviewVm {
  workspaces: OverviewWorkspaceCard[];
  activeRuns: OverviewActiveRun[];
  archive: OverviewArchiveEntry[];
  totals: {
    workspaces: number;
    activeRuns: number;
    archivedToday: number;
    pendingOutbox: number;
  };
}

export async function getOverviewVm(timeZone = "Asia/Shanghai"): Promise<OverviewVm> {
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const workspaces = await prisma.workspace.findMany({
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const healthList = await Promise.all(
    workspaces.map(async (workspace) => ({
      id: workspace.id,
      name: workspace.name,
      health: await computeWorkspaceHealth(workspace.id),
    })),
  );

  const activeRunStates = await prisma.runState.findMany({
    where: { status: { notIn: ["completed", "success", "cancelled"] } },
    orderBy: { lastOccurredAt: "desc" },
    take: 12,
    include: { workspace: true },
  });

  const activeRuns: OverviewActiveRun[] = activeRunStates.map((state) => {
    const payload =
      state.payload && typeof state.payload === "object" && !Array.isArray(state.payload)
        ? (state.payload as Record<string, unknown>)
        : {};
    return {
      workspaceId: state.workspaceId,
      workspaceName: state.workspace?.name || state.workspaceId,
      runKey: state.runKey,
      lastEventType: state.lastEventType,
      pendingGate:
        (typeof payload.pending_gate === "string" && payload.pending_gate) || null,
      currentRole:
        (typeof payload.current_role === "string" && payload.current_role) || null,
      lastOccurredAtRelative: formatRelativeTime(state.lastOccurredAt, {
        now,
        timeZone,
      }),
      status: state.status || "running",
    };
  });

  const archiveEvents = await prisma.runEvent.findMany({
    where: { eventType: { contains: "archived" } },
    orderBy: { occurredAt: "desc" },
    take: 12,
    include: { workspace: true },
  });

  const archive: OverviewArchiveEntry[] = archiveEvents.map((event) => {
    const payload =
      event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
        ? (event.payload as Record<string, unknown>)
        : {};
    return {
      id: event.id,
      workspaceId: event.workspaceId,
      workspaceName: event.workspace?.name || event.workspaceId,
      runKey: event.runKey,
      occurredAt: event.occurredAt.toISOString(),
      occurredAtRelative: formatRelativeTime(event.occurredAt, { now, timeZone }),
      payloadSummary:
        (typeof payload.summary === "string" && payload.summary) ||
        (typeof payload.title === "string" && payload.title) ||
        event.eventType,
    };
  });

  const archivedToday = await prisma.runEvent.count({
    where: {
      eventType: { contains: "archived" },
      occurredAt: { gte: startOfDay },
    },
  });

  const pendingOutbox = await prisma.controlOutbox.count({
    where: { status: { in: ["pending", "delivered"] } },
  });

  return {
    workspaces: healthList,
    activeRuns,
    archive,
    totals: {
      workspaces: workspaces.length,
      activeRuns: activeRuns.length,
      archivedToday,
      pendingOutbox,
    },
  };
}
