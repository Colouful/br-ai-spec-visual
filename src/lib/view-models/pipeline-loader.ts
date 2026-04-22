import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { formatRelativeTime } from "@/lib/view-models/formatters";
import {
  buildPipelineColumns,
  getPipelineStaleRunMaxAgeMs,
  shouldHideStaleRunFromPipeline,
  toPipelineStage,
  type PipelineCardVm,
  type WorkspacePipelineVm,
} from "@/lib/view-models/pipeline";

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function getWorkspacePipelineVm(
  workspaceId: string,
  workspaceSlug: string,
  timeZone = "Asia/Shanghai",
): Promise<WorkspacePipelineVm> {
  const now = new Date();
  const staleMaxMs = getPipelineStaleRunMaxAgeMs();
  let hiddenStaleRuns = 0;
  const [runStates, changes] = await Promise.all([
    prisma.runState.findMany({
      where: { workspaceId },
      orderBy: { lastOccurredAt: "desc" },
      take: 120,
    }),
    prisma.changeDocument.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
  ]);

  const cards: PipelineCardVm[] = [];
  const seenChangeKeys = new Set<string>();

  for (const run of runStates) {
    const payload = asRecord(run.payload);
    const task = asRecord(payload.task as Prisma.JsonValue | undefined);
    const trigger = asRecord(payload.trigger as Prisma.JsonValue | undefined);
    const pendingGate = asString(payload.pending_gate) || null;
    const currentRole = asString(payload.current_role) || null;
    const changeKey = asString(task.change_id) || null;
    if (changeKey) seenChangeKeys.add(changeKey);

    const stage = toPipelineStage({
      kind: "run",
      status: run.status,
      lastEventType: run.lastEventType,
      pendingGate,
      currentRole,
    });

    if (
      shouldHideStaleRunFromPipeline(
        {
          kind: "run",
          stage,
          lastOccurredAt: run.lastOccurredAt,
          now,
        },
        staleMaxMs,
      )
    ) {
      hiddenStaleRuns += 1;
      continue;
    }

    cards.push({
      id: `run:${run.runKey}`,
      kind: "run",
      stage,
      title: changeKey || asString(trigger.raw_input).slice(0, 80) || run.runKey,
      subtitle: run.lastEventType,
      status: run.status || "running",
      changeKey,
      runKey: run.runKey,
      ownerRole: currentRole,
      pendingGate,
      lastActivityRelative: formatRelativeTime(run.lastOccurredAt, { now, timeZone }),
      lastActivityIso: run.lastOccurredAt.toISOString(),
      href: `/w/${encodeURIComponent(workspaceSlug)}/runs/${encodeURIComponent(run.runKey)}`,
    });
  }

  for (const change of changes) {
    if (change.changeKey && seenChangeKeys.has(change.changeKey)) continue;
    const stage = toPipelineStage({
      kind: "change",
      docType: change.docType,
      status: change.status,
      archivedAt: change.archivedAt,
    });

    cards.push({
      id: `change:${change.changeKey}:${change.docType}`,
      kind: "change",
      stage,
      title: change.title || `${change.changeKey} / ${change.docType}`,
      subtitle: `change · ${change.docType}`,
      status: change.status || "draft",
      changeKey: change.changeKey,
      runKey: null,
      ownerRole: null,
      pendingGate: null,
      lastActivityRelative: formatRelativeTime(change.updatedAt, { now, timeZone }),
      lastActivityIso: change.updatedAt.toISOString(),
      href: `/w/${encodeURIComponent(workspaceSlug)}/changes/${encodeURIComponent(change.changeKey)}__${encodeURIComponent(change.docType)}`,
    });
  }

  const columns = buildPipelineColumns(cards);

  return {
    workspaceId,
    workspaceSlug,
    columns,
    totalCards: cards.length,
    totalArchive: cards.filter((card) => card.stage === "archive").length,
    pendingReview: cards.filter((card) => card.stage === "review").length,
    activeRun: cards.filter((card) => card.stage === "run").length,
    hiddenStaleRuns,
  };
}
