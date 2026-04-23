import { prisma } from "@/lib/db/prisma";
import { ensureReadModelBootstrap } from "@/lib/services/read-model";
import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-context/server";

export interface RouteDecisionWorkspaceVm {
  id: string;
  slug: string;
  name: string;
  activeRunCount: number;
  openChangeCount: number;
  archivedChangeCount: number;
  pendingArchiveGateCount: number;
}

export interface RouteDecisionPageVm {
  defaultWorkspaceSlug: string | null;
  workspaces: RouteDecisionWorkspaceVm[];
}

function isActiveRunStatus(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();
  return !["completed", "success", "failed", "cancelled", "canceled", "archived"].includes(normalized);
}

function hasBeforeArchiveGate(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  const record = payload as Record<string, unknown>;
  return record.pending_gate === "before-archive";
}

export async function getRouteDecisionPageVm(): Promise<RouteDecisionPageVm> {
  await ensureReadModelBootstrap();

  const [defaultWorkspaceSlug, workspaces, runStates, changes] = await Promise.all([
    resolveDefaultWorkspaceSlug(),
    prisma.workspace.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
      },
      take: 30,
    }),
    prisma.runState.findMany({
      select: {
        workspaceId: true,
        status: true,
        payload: true,
      },
      take: 400,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.changeDocument.findMany({
      select: {
        workspaceId: true,
        changeKey: true,
        archivedAt: true,
        status: true,
      },
      take: 600,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const runSummary = new Map<
    string,
    { activeRunCount: number; pendingArchiveGateCount: number }
  >();
  for (const run of runStates) {
    const current = runSummary.get(run.workspaceId) ?? {
      activeRunCount: 0,
      pendingArchiveGateCount: 0,
    };
    if (isActiveRunStatus(run.status)) {
      current.activeRunCount += 1;
    }
    if (hasBeforeArchiveGate(run.payload)) {
      current.pendingArchiveGateCount += 1;
    }
    runSummary.set(run.workspaceId, current);
  }

  const changeSummary = new Map<
    string,
    { open: Set<string>; archived: Set<string> }
  >();
  for (const change of changes) {
    const current = changeSummary.get(change.workspaceId) ?? {
      open: new Set<string>(),
      archived: new Set<string>(),
    };
    const normalizedStatus = String(change.status || "").toLowerCase();
    const isArchived =
      Boolean(change.archivedAt) ||
      ["archived", "merged", "completed"].includes(normalizedStatus);
    if (isArchived) {
      current.archived.add(change.changeKey);
    } else {
      current.open.add(change.changeKey);
    }
    changeSummary.set(change.workspaceId, current);
  }

  return {
    defaultWorkspaceSlug,
    workspaces: workspaces.map((workspace) => ({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      activeRunCount: runSummary.get(workspace.id)?.activeRunCount ?? 0,
      openChangeCount: changeSummary.get(workspace.id)?.open.size ?? 0,
      archivedChangeCount: changeSummary.get(workspace.id)?.archived.size ?? 0,
      pendingArchiveGateCount:
        runSummary.get(workspace.id)?.pendingArchiveGateCount ?? 0,
    })),
  };
}
