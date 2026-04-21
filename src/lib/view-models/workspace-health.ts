import { prisma } from "@/lib/db/prisma";

export interface WorkspaceHealthBreakdown {
  score: number;
  grade: "A" | "B" | "C" | "D";
  totals: {
    runs: number;
    archivedRuns: number;
    pendingGates: number;
    openAlerts: number;
    activeChanges: number;
    receivedReceipts: number;
  };
  signals: Array<{ label: string; value: string; tone: "good" | "warn" | "bad" }>;
}

function classifyGrade(score: number): WorkspaceHealthBreakdown["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

export async function computeWorkspaceHealth(
  workspaceId: string,
): Promise<WorkspaceHealthBreakdown> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    runStates,
    openAlerts,
    pendingGatesPayload,
    archivedRecent,
    activeChanges,
    pendingOutbox,
    receivedReceipts,
  ] = await Promise.all([
    prisma.runState.count({ where: { workspaceId } }),
    prisma.alert.count({ where: { workspaceId, status: "open" } }),
    prisma.runState.findMany({
      where: { workspaceId },
      select: { payload: true },
      take: 100,
    }),
    prisma.runEvent.count({
      where: {
        workspaceId,
        eventType: { contains: "archived" },
        occurredAt: { gte: since },
      },
    }),
    prisma.changeDocument.count({
      where: {
        workspaceId,
        archivedAt: null,
      },
    }),
    prisma.controlOutbox.count({
      where: {
        workspaceId,
        status: { in: ["pending", "delivered"] },
      },
    }),
    prisma.runEvent.count({
      where: {
        workspaceId,
        eventType: "control.receipt",
        occurredAt: { gte: since },
      },
    }),
  ]);

  const pendingGates = pendingGatesPayload.filter((row) => {
    const value = row.payload;
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const gate = (value as Record<string, unknown>).pending_gate;
    return typeof gate === "string" && gate.length > 0;
  }).length;

  let score = 100;
  score -= openAlerts * 8;
  score -= pendingGates * 5;
  score -= pendingOutbox * 4;
  if (runStates === 0) score -= 25;
  if (receivedReceipts > 0) score += 6;
  if (archivedRecent > 0) score += 4;
  score = Math.max(0, Math.min(100, score));

  const grade = classifyGrade(score);
  const tone = (positive: boolean) => (positive ? "good" : "warn");
  const sign = (count: number, danger: number) =>
    count === 0 ? "good" : count >= danger ? "bad" : "warn";

  return {
    score,
    grade,
    totals: {
      runs: runStates,
      archivedRuns: archivedRecent,
      pendingGates,
      openAlerts,
      activeChanges,
      receivedReceipts,
    },
    signals: [
      {
        label: "未关闭告警",
        value: String(openAlerts),
        tone: sign(openAlerts, 3),
      },
      {
        label: "待审 Gate",
        value: String(pendingGates),
        tone: sign(pendingGates, 3),
      },
      {
        label: "Outbox 积压",
        value: String(pendingOutbox),
        tone: sign(pendingOutbox, 5),
      },
      {
        label: "24h 控制回执",
        value: String(receivedReceipts),
        tone: tone(receivedReceipts > 0),
      },
      {
        label: "24h 归档事件",
        value: String(archivedRecent),
        tone: tone(archivedRecent > 0),
      },
      {
        label: "活跃变更",
        value: String(activeChanges),
        tone: tone(activeChanges > 0),
      },
    ],
  };
}
