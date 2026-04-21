import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { formatRelativeTime } from "@/lib/view-models/formatters";

export type BoardLaneId =
  | "backlog"
  | "proposal"
  | "implementation"
  | "guardian"
  | "archive";

export interface BoardCardVm {
  id: string;
  runKey: string;
  title: string;
  subtitle: string;
  status: string;
  pendingGate: string | null;
  currentRole: string | null;
  changeKey: string | null;
  lastEventType: string;
  lastOccurredAt: string;
  updatedAt: string;
  artifacts: Array<{ slug: string; label: string }>;
  laneId: BoardLaneId;
}

export interface BoardLaneVm {
  id: BoardLaneId;
  title: string;
  description: string;
  accent: string;
  cards: BoardCardVm[];
}

export interface WorkspaceBoardVm {
  workspaceId: string;
  lanes: BoardLaneVm[];
  totalActive: number;
  totalArchived: number;
  pendingGates: number;
}

const LANE_META: Record<BoardLaneId, Pick<BoardLaneVm, "title" | "description" | "accent">> = {
  backlog: {
    title: "Backlog",
    description: "未启动的提案候选与待澄清需求",
    accent: "from-slate-400/30 to-slate-700/30",
  },
  proposal: {
    title: "Proposal",
    description: "正在拟定 / 待审核的 OpenSpec 提案",
    accent: "from-cyan-300/30 to-sky-700/30",
  },
  implementation: {
    title: "Implementation",
    description: "执行中的任务与运行实例",
    accent: "from-amber-300/30 to-orange-700/30",
  },
  guardian: {
    title: "Guardian",
    description: "等待人工审核 / 守门员介入",
    accent: "from-fuchsia-300/30 to-purple-700/30",
  },
  archive: {
    title: "Archive",
    description: "已归档运行与变更证据",
    accent: "from-emerald-300/30 to-teal-700/30",
  },
};

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function classifyLane(input: {
  status: string | null;
  lastEventType: string;
  pendingGate: string | null;
  currentRole: string | null;
}): BoardLaneId {
  const event = (input.lastEventType || "").toLowerCase();
  const gate = (input.pendingGate || "").toLowerCase();
  const status = (input.status || "").toLowerCase();

  if (status === "completed" || status === "success" || event.includes("archived")) {
    return "archive";
  }
  if (gate || event.includes("gate") || status === "awaiting_review") {
    return "guardian";
  }
  if (event.includes("proposal") || event.includes("spec.proposed") || status === "proposed") {
    return "proposal";
  }
  if (status === "queued" || status === "planned" || status === "observed") {
    return "backlog";
  }
  return "implementation";
}

function pickArtifacts(payload: Prisma.JsonValue | null | undefined) {
  const root = asRecord(payload);
  const artifacts = root.artifacts;
  if (!Array.isArray(artifacts)) {
    return [] as Array<{ slug: string; label: string }>;
  }
  return artifacts
    .map((entry) => {
      if (typeof entry === "string") {
        return { slug: entry, label: entry };
      }
      const rec = asRecord(entry as Prisma.JsonValue);
      const slug = asString(rec.slug) || asString(rec.name);
      if (!slug) return null;
      return {
        slug,
        label: asString(rec.label) || slug,
      };
    })
    .filter((entry): entry is { slug: string; label: string } => Boolean(entry))
    .slice(0, 6);
}

export async function getWorkspaceBoardVm(
  workspaceId: string,
  timeZone = "Asia/Shanghai",
): Promise<WorkspaceBoardVm> {
  const now = new Date();
  const [runStates, changes] = await Promise.all([
    prisma.runState.findMany({
      where: { workspaceId },
      orderBy: { lastOccurredAt: "desc" },
      take: 80,
    }),
    prisma.changeDocument.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
  ]);

  const cards: BoardCardVm[] = [];

  for (const run of runStates) {
    const payload = asRecord(run.payload);
    const task = asRecord(payload.task as Prisma.JsonValue | undefined);
    const trigger = asRecord(payload.trigger as Prisma.JsonValue | undefined);
    const pendingGate = asString(payload.pending_gate) || null;
    const currentRole = asString(payload.current_role) || null;

    const laneId = classifyLane({
      status: run.status,
      lastEventType: run.lastEventType,
      pendingGate,
      currentRole,
    });

    cards.push({
      id: `run:${run.runKey}`,
      runKey: run.runKey,
      title:
        asString(task.change_id) ||
        asString(trigger.raw_input).slice(0, 80) ||
        run.runKey,
      subtitle: run.lastEventType,
      status: run.status || "running",
      pendingGate,
      currentRole,
      changeKey: asString(task.change_id) || null,
      lastEventType: run.lastEventType,
      lastOccurredAt: formatRelativeTime(run.lastOccurredAt, { now, timeZone }),
      updatedAt: run.updatedAt.toISOString(),
      artifacts: pickArtifacts(run.payload),
      laneId,
    });
  }

  const seenChangeKeys = new Set(
    cards.map((card) => card.changeKey).filter(Boolean) as string[],
  );

  for (const change of changes) {
    if (seenChangeKeys.has(change.changeKey)) continue;
    const status = (change.status || "").toLowerCase();
    let laneId: BoardLaneId = "backlog";
    if (change.archivedAt || status === "archived") {
      laneId = "archive";
    } else if (status === "review" || status === "guardian") {
      laneId = "guardian";
    } else if (status === "proposed" || change.docType === "proposal") {
      laneId = "proposal";
    } else if (status === "implementation" || status === "running") {
      laneId = "implementation";
    }

    cards.push({
      id: `change:${change.changeKey}:${change.docType}`,
      runKey: `change:${change.changeKey}`,
      title: change.title || `${change.changeKey} / ${change.docType}`,
      subtitle: `change · ${change.docType}`,
      status: change.status || "draft",
      pendingGate: null,
      currentRole: null,
      changeKey: change.changeKey,
      lastEventType: `change.${change.docType}`,
      lastOccurredAt: formatRelativeTime(change.updatedAt, { now, timeZone }),
      updatedAt: change.updatedAt.toISOString(),
      artifacts: [],
      laneId,
    });
  }

  const lanes: BoardLaneVm[] = (Object.keys(LANE_META) as BoardLaneId[]).map(
    (laneId) => ({
      id: laneId,
      ...LANE_META[laneId],
      cards: cards
        .filter((card) => card.laneId === laneId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    }),
  );

  return {
    workspaceId,
    lanes,
    totalActive: cards.filter((card) => card.laneId !== "archive").length,
    totalArchived: cards.filter((card) => card.laneId === "archive").length,
    pendingGates: cards.filter((card) => card.pendingGate).length,
  };
}
