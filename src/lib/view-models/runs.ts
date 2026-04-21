import { prisma } from "@/lib/db/prisma";
import { getDemoConsoleData } from "@/lib/demo/console-data";
import { getRunReadModel, listRunReadModels } from "@/lib/services/read-model";
import {
  formatDuration,
  formatRelativeTime,
  formatTimestamp,
} from "@/lib/view-models/formatters";
import { normalizeRunStatusKey } from "@/lib/view-models/run-status";
import { buildRunsBuckets } from "@/lib/view-models/runs-shared";
import { getStatusBadge } from "@/lib/view-models/status";
import type { MetricVm, PageHeroVm, StatusKey } from "@/lib/view-models/types";

export type RunEvidenceStageId =
  | "proposal"
  | "design"
  | "tasks"
  | "delta"
  | "archive";

export interface RunEvidenceArtifact {
  id: string;
  title: string;
  docType: string;
  status: string | null;
  updatedAt: string;
  sourcePath: string;
  href?: string;
}

export interface RunEvidenceStage {
  id: RunEvidenceStageId;
  label: string;
  artifacts: RunEvidenceArtifact[];
}

export interface RunTraceEvent {
  id: string;
  eventType: string;
  occurredAt: string;
  occurredAtRelative: string;
  category: "state" | "control" | "receipt" | "other";
  summary: string;
}

export interface RunGateInfo {
  pendingGate: string | null;
  currentRole: string | null;
  awaitingDecision: boolean;
  outbox: Array<{
    id: string;
    command: string;
    status: string;
    createdAt: string;
    appliedAt: string | null;
    reason: string | null;
  }>;
}

export interface RunCardVm {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  summary: string;
  statusKey: StatusKey;
  status: ReturnType<typeof getStatusBadge>;
  trigger: string;
  startedAtIso: string;
  updatedAtIso: string;
  startedAt: string;
  updatedAt: string;
  duration: string;
  progressLabel: string;
  progressValue: number;
  operator: string;
  changeId?: string;
}

export interface RunsPageVm {
  hero: PageHeroVm;
  active: RunCardVm[];
  history: RunCardVm[];
  signals: MetricVm[];
}

export interface RunDetailVm {
  hero: PageHeroVm;
  run: RunCardVm & {
    stages: Array<{
      id: string;
      label: string;
      status: ReturnType<typeof getStatusBadge>;
      duration: string;
      summary: string;
    }>;
    logs: string[];
    evidenceStages: RunEvidenceStage[];
    traceEvents: RunTraceEvent[];
    gate: RunGateInfo;
  };
}

function classifyDocStage(docType: string): RunEvidenceStageId {
  const value = (docType || "").toLowerCase();
  if (value.includes("proposal")) return "proposal";
  if (value.includes("design")) return "design";
  if (value.includes("task")) return "tasks";
  if (value.includes("delta") || value.includes("spec")) return "delta";
  return "archive";
}

const STAGE_LABEL: Record<RunEvidenceStageId, string> = {
  proposal: "Proposal",
  design: "Design",
  tasks: "Tasks",
  delta: "Spec Delta",
  archive: "Archive",
};

function classifyEventCategory(eventType: string): RunTraceEvent["category"] {
  const value = (eventType || "").toLowerCase();
  if (value.startsWith("control.")) return "control";
  if (value.includes("receipt")) return "receipt";
  if (value.startsWith("run.state") || value.includes("state_changed")) {
    return "state";
  }
  return "other";
}

async function buildEvidenceStages(
  workspaceId: string,
  changeId: string | undefined,
): Promise<RunEvidenceStage[]> {
  if (!changeId) {
    return (Object.keys(STAGE_LABEL) as RunEvidenceStageId[]).map((id) => ({
      id,
      label: STAGE_LABEL[id],
      artifacts: [],
    }));
  }
  const docs = await prisma.changeDocument.findMany({
    where: { workspaceId, changeKey: changeId },
    orderBy: { updatedAt: "asc" },
  });

  const grouped = new Map<RunEvidenceStageId, RunEvidenceArtifact[]>();
  for (const stage of Object.keys(STAGE_LABEL) as RunEvidenceStageId[]) {
    grouped.set(stage, []);
  }
  for (const doc of docs) {
    const stage = classifyDocStage(doc.docType);
    grouped.get(stage)!.push({
      id: doc.id,
      title: doc.title || `${doc.changeKey} / ${doc.docType}`,
      docType: doc.docType,
      status: doc.status,
      updatedAt: doc.updatedAt.toISOString(),
      sourcePath: doc.sourcePath,
      href: `/changes/${doc.changeKey}__${doc.docType}`,
    });
  }
  return (Object.keys(STAGE_LABEL) as RunEvidenceStageId[]).map((id) => ({
    id,
    label: STAGE_LABEL[id],
    artifacts: grouped.get(id) || [],
  }));
}

async function buildGateInfo(
  workspaceId: string,
  runKey: string,
  payload: unknown,
): Promise<RunGateInfo> {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const pendingGate =
    typeof record.pending_gate === "string" && record.pending_gate
      ? record.pending_gate
      : null;
  const currentRole =
    typeof record.current_role === "string" && record.current_role
      ? record.current_role
      : null;

  const outboxRows = await prisma.controlOutbox.findMany({
    where: { workspaceId, runKey },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    pendingGate,
    currentRole,
    awaitingDecision: Boolean(pendingGate),
    outbox: outboxRows.map((row) => ({
      id: row.id,
      command: row.command,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      appliedAt: row.appliedAt?.toISOString() ?? null,
      reason: row.reason,
    })),
  };
}

function summarizePayload(payload: unknown) {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const trigger =
    record.trigger && typeof record.trigger === "object" && !Array.isArray(record.trigger)
      ? (record.trigger as Record<string, unknown>)
      : {};
  const task =
    record.task && typeof record.task === "object" && !Array.isArray(record.task)
      ? (record.task as Record<string, unknown>)
      : {};
  const flow =
    record.flow && typeof record.flow === "object" && !Array.isArray(record.flow)
      ? (record.flow as Record<string, unknown>)
      : {};

  return {
    title:
      (typeof task.change_id === "string" && task.change_id) ||
      (typeof trigger.raw_input === "string" && trigger.raw_input) ||
      (typeof flow.name === "string" && flow.name) ||
      "运行事件",
    summary:
      (typeof trigger.raw_input === "string" && trigger.raw_input) ||
      (typeof flow.name === "string" && flow.name) ||
      "来自运行态桥接的数据库投影。",
    trigger:
      [
        typeof trigger.source === "string" ? trigger.source : "",
        typeof trigger.entry === "string" ? trigger.entry : "",
      ]
        .filter(Boolean)
        .join(" / ") || "runtime-state",
    operator:
      (typeof record.current_role === "string" && record.current_role) || "system",
    changeId:
      typeof task.change_id === "string" && task.change_id ? task.change_id : undefined,
  };
}

function mapRealRunCard(
  run: Awaited<ReturnType<typeof listRunReadModels>>[number],
  timeZone: string,
  now: Date,
): RunCardVm {
  const startedAtIso = run.events.at(-1)?.occurredAt || run.lastOccurredAt;
  return {
    id: run.id,
    title: run.title,
    workspaceId: run.workspaceId,
    workspaceName: run.workspaceName,
    summary: run.summary,
    statusKey: normalizeRunStatusKey(run.status),
    status: getStatusBadge(normalizeRunStatusKey(run.status)),
    trigger: run.trigger,
    startedAtIso,
    updatedAtIso: run.lastOccurredAt,
    startedAt: formatTimestamp(startedAtIso, { timeZone }),
    updatedAt: formatRelativeTime(run.lastOccurredAt, { now, timeZone }),
    duration: formatDuration(Math.max(60_000, run.turnCount * 60_000)),
    progressLabel: run.status === "completed" ? "100%" : run.status === "queued" ? "20%" : "70%",
    progressValue: run.status === "completed" ? 1 : run.status === "queued" ? 0.2 : 0.7,
    operator: run.operator,
    changeId: run.changeId,
  };
}

async function buildDemoRunCard(runId: string, timeZone: string): Promise<RunCardVm> {
  const data = await getDemoConsoleData();
  const demoRun = data.runs.find((item) => item.id === runId);
  if (!demoRun) {
    throw new Error(`Run ${runId} not found`);
  }
  const workspace = data.workspaces.find((item) => item.id === demoRun.workspaceId);
  const now = new Date(data.now);
  const finishedAt = demoRun.finishedAt ?? data.now;
  const duration = formatDuration(
    Math.max(0, new Date(finishedAt).getTime() - new Date(demoRun.startedAt).getTime()),
  );

  return {
    id: demoRun.id,
    title: demoRun.title,
    workspaceId: demoRun.workspaceId,
    workspaceName: workspace?.name ?? demoRun.workspaceId,
    summary: demoRun.summary,
    statusKey: demoRun.status,
    status: getStatusBadge(demoRun.status),
    trigger: demoRun.trigger,
    startedAtIso: demoRun.startedAt,
    updatedAtIso: demoRun.updatedAt,
    startedAt: formatTimestamp(demoRun.startedAt, { timeZone }),
    updatedAt: formatRelativeTime(demoRun.updatedAt, { now, timeZone }),
    duration,
    progressLabel: `${Math.round(demoRun.progress * 100)}%`,
    progressValue: demoRun.progress,
    operator: demoRun.operator,
    changeId: demoRun.changeId,
  };
}

export async function getRunsPageVm(timeZone = "Asia/Shanghai"): Promise<RunsPageVm> {
  const realRuns = await listRunReadModels();
  if (realRuns.length > 0) {
    const now = new Date();
    const cards = realRuns.map((run: Awaited<ReturnType<typeof listRunReadModels>>[number]) =>
      mapRealRunCard(run, timeZone, now),
    );
    const buckets = buildRunsBuckets(cards);

    return {
      hero: {
        eyebrow: "运行记录",
        title: "按时间展开的执行时间线",
        subtitle:
          "当前运行列表已直接读取数据库投影；`run-state(运行状态)` 和 `OMX(日志)` 入库后会优先显示真实记录。",
        stats: [
          { label: "活跃运行", value: String(buckets.active.length) },
          { label: "历史运行", value: String(buckets.history.length) },
          { label: "失败数", value: String(cards.filter((card) => card.status.label === "失败").length) },
        ],
      },
      active: buckets.active,
      history: buckets.history,
      signals: buckets.signals,
    };
  }

  const data = await getDemoConsoleData();
  const cards = await Promise.all(data.runs.map((run) => buildDemoRunCard(run.id, timeZone)));
  const buckets = buildRunsBuckets(cards);
  const failedRuns = data.runs.filter((run) => run.status === "failed");

  return {
    hero: {
        eyebrow: "运行记录",
        title: "按时间展开的执行时间线",
      subtitle:
        "运行列表默认由服务端拼好，只有运行中的局部时钟会在客户端刷新，避免把整条时间线搬到浏览器里。",
      stats: [
        { label: "活跃运行", value: String(buckets.active.length) },
        { label: "历史运行", value: String(buckets.history.length) },
        { label: "失败数", value: String(failedRuns.length) },
      ],
    },
    active: buckets.active,
    history: buckets.history,
    signals: [
      {
        label: "策略等待",
        value: String(
          data.runs.filter((run) => run.stages.some((stage) => stage.status === "queued")).length,
        ),
      },
      {
        label: "回放事件",
        value: String(data.runs.filter((run) => run.trigger.toLowerCase().includes("replay")).length),
      },
      {
        label: "中位耗时",
        value: "31m",
        note: "先用 demo 数据，真实 API 接入后可替换为聚合值",
      },
    ],
  };
}

export async function getRunDetailVm(
  runId: string,
  timeZone = "Asia/Shanghai",
): Promise<RunDetailVm | null> {
  const realRun = await getRunReadModel(runId);
  if (realRun) {
    const summary = summarizePayload(realRun.payload);
    const status = normalizeRunStatusKey(realRun.status);
    const startedAtIso =
      realRun.runEvents[0]?.occurredAt?.toISOString() || realRun.lastOccurredAt.toISOString();
    const now = new Date();

    const [evidenceStages, gate] = await Promise.all([
      buildEvidenceStages(realRun.workspaceId, summary.changeId),
      buildGateInfo(realRun.workspaceId, realRun.runKey, realRun.payload),
    ]);

    const traceEvents: RunTraceEvent[] = realRun.runEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      occurredAtRelative: formatRelativeTime(event.occurredAt, { now, timeZone }),
      category: classifyEventCategory(event.eventType),
      summary:
        typeof event.payload === "object" && event.payload !== null
          ? JSON.stringify(event.payload).slice(0, 200)
          : String(event.payload ?? ""),
    }));

    return {
      hero: {
        eyebrow: realRun.workspace?.name || realRun.workspaceId,
        title: summary.title,
        subtitle: summary.summary,
        stats: [
          { label: "状态", value: getStatusBadge(status).label },
          { label: "开始时间", value: formatTimestamp(startedAtIso, { timeZone }) },
          { label: "事件数", value: String(realRun.runEvents.length) },
        ],
      },
      run: {
        id: realRun.runKey,
        title: summary.title,
        workspaceId: realRun.workspaceId,
        workspaceName: realRun.workspace?.name || realRun.workspaceId,
        summary: summary.summary,
        statusKey: status,
        status: getStatusBadge(status),
        trigger: summary.trigger,
        startedAtIso,
        updatedAtIso: realRun.lastOccurredAt.toISOString(),
        startedAt: formatTimestamp(startedAtIso, { timeZone }),
        updatedAt: formatRelativeTime(realRun.lastOccurredAt, { now: new Date(), timeZone }),
        duration: formatDuration(Math.max(60_000, realRun.turnCount * 60_000)),
        progressLabel: status === "completed" ? "100%" : "70%",
        progressValue: status === "completed" ? 1 : 0.7,
        operator: summary.operator,
        changeId: summary.changeId,
        stages: realRun.runEvents.map((event) => ({
          id: event.id,
          label: event.eventType,
          status: getStatusBadge(status),
          duration: "1m",
          summary: JSON.stringify(event.payload).slice(0, 160),
        })),
        logs: realRun.runEvents.map(
          (event) => `[${event.occurredAt.toISOString()}] ${event.eventType}`,
        ),
        evidenceStages,
        traceEvents,
        gate,
      },
    };
  }

  const data = await getDemoConsoleData();
  const demoRun = data.runs.find((item) => item.id === runId);
  if (!demoRun) {
    return null;
  }
  const card = await buildDemoRunCard(demoRun.id, timeZone);

  return {
    hero: {
      eyebrow: card.workspaceName,
      title: card.title,
      subtitle: card.summary,
      stats: [
        { label: "状态", value: card.status.label },
        { label: "开始时间", value: card.startedAt },
        { label: "耗时", value: card.duration },
      ],
    },
    run: {
      ...card,
      stages: demoRun.stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        status: getStatusBadge(stage.status),
        duration: formatDuration(stage.durationMs),
        summary: stage.summary,
      })),
      logs: demoRun.logs,
      evidenceStages: (Object.keys(STAGE_LABEL) as RunEvidenceStageId[]).map(
        (id) => ({ id, label: STAGE_LABEL[id], artifacts: [] }),
      ),
      traceEvents: demoRun.logs.map((line, index) => ({
        id: `${demoRun.id}:${index}`,
        eventType: "demo.log",
        occurredAt: demoRun.updatedAt,
        occurredAtRelative: formatRelativeTime(demoRun.updatedAt, {
          now: new Date(),
          timeZone,
        }),
        category: "other" as const,
        summary: line,
      })),
      gate: {
        pendingGate: null,
        currentRole: card.operator,
        awaitingDecision: false,
        outbox: [],
      },
    },
  };
}
