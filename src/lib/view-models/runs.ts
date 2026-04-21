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
    },
  };
}
