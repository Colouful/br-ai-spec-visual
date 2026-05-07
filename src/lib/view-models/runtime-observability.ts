import {
  formatDuration,
  formatRelativeTime,
  formatTimestamp,
} from "@/lib/view-models/formatters";
import { normalizeRunStatusKey } from "@/lib/view-models/run-status";
import { buildRunsBuckets } from "@/lib/view-models/runs-shared";
import { getStatusBadge } from "@/lib/view-models/status";
import type { MetricVm } from "@/lib/view-models/types";
import type {
  RunCardVm,
  RunDetailVm,
  RunTraceEvent,
  RunsPageVm,
} from "@/lib/view-models/runs";
import type {
  VisualEvidenceReportRecord,
  VisualRuntimeEventRecord,
} from "@/server/collector/types";
import type { CollectorStore } from "@/server/collector/repository";

export type RunRuntimeResultItemVm = {
  id: string;
  label: string;
  status: string;
  summary: string;
  meta: string;
  blocking: boolean;
};

export type RunRuntimeResultsVm = {
  changedFiles: RunRuntimeResultItemVm[];
  hookResults: RunRuntimeResultItemVm[];
  testResults: RunRuntimeResultItemVm[];
  repairResults: RunRuntimeResultItemVm[];
  reviewResults: RunRuntimeResultItemVm[];
  finalStatus: VisualEvidenceReportRecord["finalStatus"];
  blockerCount: number;
  maxRepairAttempts: number;
};

export type RunAgentCollaborationVm = {
  summary: string;
  items: Array<{
    id: string;
    role: string;
    status: string;
    order: number;
    inputSummary: string;
    outputSummary: string;
  }>;
  conflicts: string[];
  humanGates: string[];
  finalDecision: string;
};

export type RuntimeQualityRiskVm = {
  quality: {
    timeRangeLabel: string;
    projectId: string | null;
    cards: MetricVm[];
    trend: Array<{ label: string; value: number; status: string }>;
  };
  risk: {
    filters: {
      projectId: string | null;
      eventTypes: string[];
      severities: string[];
    };
    events: Array<{
      id: string;
      runId: string;
      projectId: string;
      eventType: string;
      severity: string;
      stage: string;
      summary: string;
      occurredAt: string;
    }>;
  };
};

export function buildCollectorRunsPageVm(
  store: CollectorStore,
  timeZone = "Asia/Shanghai",
  now = new Date(),
): RunsPageVm | null {
  const runs = Array.from(store.runs.values());
  if (runs.length === 0) return null;

  const cards = runs
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((run) => {
      const events = eventsForRun(store, run.runId);
      const startedAtIso = run.startedAt || events[0]?.createdAt || run.createdAt;
      const updatedAtIso = run.completedAt || events.at(-1)?.createdAt || run.updatedAt;
      const statusKey = normalizeRunStatusKey(run.state);
      return {
        id: run.runId,
        title: run.requirementSummary || run.runId,
        workspaceId: run.workspaceId || run.projectId,
        workspaceName: run.workspaceId || run.projectId,
        summary: run.requirementSummary || `项目 ${run.projectId} 的结构化运行记录。`,
        statusKey,
        status: getStatusBadge(statusKey),
        trigger: run.stage || "collector",
        startedAtIso,
        updatedAtIso,
        startedAt: formatTimestamp(startedAtIso, { timeZone }),
        updatedAt: formatRelativeTime(updatedAtIso, { now, timeZone }),
        duration: formatRunDuration(startedAtIso, updatedAtIso),
        progressLabel: statusKey === "completed" ? "100%" : statusKey === "blocked" || statusKey === "failed" ? "已结束" : "70%",
        progressValue: statusKey === "completed" ? 1 : statusKey === "blocked" || statusKey === "failed" ? 1 : 0.7,
        operator: run.executor || agentLabelFromEvents(events) || "collector",
      } satisfies RunCardVm;
    });
  const buckets = buildRunsBuckets(cards);
  const runtimeOverview = buildRuntimeQualityRiskVm(store);

  return {
    hero: {
      eyebrow: "运行记录",
      title: "AI Spec 运行态观测",
      subtitle: "基于 Collector API(采集接口) 接收的 RunEvent(运行事件) 和 EvidenceReport(证据报告) 展示时间线、质量和风险摘要。",
      stats: [
        { label: "运行数", value: String(cards.length) },
        { label: "事件数", value: String(store.runEvents.size) },
        { label: "证据报告", value: String(store.evidenceReports.size) },
      ],
    },
    active: buckets.active,
    history: buckets.history,
    signals: runtimeOverview.quality.cards.slice(0, 3),
    runtimeOverview,
  };
}

export function buildCollectorRunDetailVm(
  store: CollectorStore,
  runId: string,
  timeZone = "Asia/Shanghai",
  now = new Date(),
): RunDetailVm | null {
  const run = store.runs.get(runId);
  if (!run) return null;

  const events = eventsForRun(store, runId);
  const evidence = store.evidenceReports.get(runId);
  const startedAtIso = run.startedAt || events[0]?.createdAt || run.createdAt;
  const updatedAtIso = run.completedAt || events.at(-1)?.createdAt || run.updatedAt;
  const statusKey = normalizeRunStatusKey(run.state);
  const agentCollaboration = buildAgentCollaboration(events, evidence);
  const runtimeResults = buildRuntimeResults(evidence);

  return {
    hero: {
      eyebrow: run.projectId,
      title: run.requirementSummary || run.runId,
      subtitle: "结构化展示运行事件、证据摘要、Agent(代理)协作、门禁和风险信号。",
      stats: [
        { label: "状态", value: getStatusBadge(statusKey).label },
        { label: "事件数", value: String(events.length) },
        { label: "阻塞项", value: String(runtimeResults.blockerCount) },
      ],
    },
    run: {
      id: run.runId,
      title: run.requirementSummary || run.runId,
      workspaceId: run.workspaceId || run.projectId,
      workspaceName: run.workspaceId || run.projectId,
      summary: run.requirementSummary || `项目 ${run.projectId} 的运行详情。`,
      statusKey,
      status: getStatusBadge(statusKey),
      trigger: run.stage || "collector",
      startedAtIso,
      updatedAtIso,
      startedAt: formatTimestamp(startedAtIso, { timeZone }),
      updatedAt: formatRelativeTime(updatedAtIso, { now, timeZone }),
      duration: formatRunDuration(startedAtIso, updatedAtIso),
      progressLabel: statusKey === "completed" ? "100%" : statusKey === "running" ? "70%" : "已结束",
      progressValue: statusKey === "completed" ? 1 : statusKey === "running" ? 0.7 : 1,
      operator: run.executor || agentLabelFromEvents(events) || "collector",
      stages: events.map((event) => {
        const eventStatus = normalizeRunStatusKey(event.state || event.level);
        return {
          id: event.id,
          label: event.type,
          status: getStatusBadge(eventStatus),
          duration: "事件",
          summary: summarizeEvent(event),
        };
      }),
      logs: events.map((event) => `[${event.createdAt}] ${event.type}`),
      evidenceStages: [
        {
          id: "archive",
          label: "证据报告",
          artifacts: (evidence?.changedFiles ?? []).map((item, index) => {
            const record = asRecord(item);
            return {
              id: `${runId}:file:${index}`,
              title: asString(record.summary) || asString(record.path) || "变更摘要",
              docType: asString(record.changeType) || "change",
              status: evidence?.finalStatus ?? null,
              updatedAt: evidence?.updatedAt || updatedAtIso,
              sourcePath: asString(record.path) || "未提供路径",
            };
          }),
        },
      ],
      traceEvents: events.map((event) => ({
        id: event.id,
        eventType: event.type,
        occurredAt: event.createdAt,
        occurredAtRelative: formatRelativeTime(event.createdAt, { now, timeZone }),
        category: classifyEventCategory(event.type),
        summary: summarizeEvent(event),
      })),
      gate: {
        pendingGate: agentCollaboration.humanGates[0] ?? null,
        currentRole: agentCollaboration.items.at(-1)?.role ?? null,
        awaitingDecision: agentCollaboration.humanGates.length > 0,
        outbox: [],
      },
      runtimeResults,
      agentCollaboration,
    },
  };
}

export function buildRuntimeQualityRiskVm(
  store: CollectorStore,
  filters: { projectId?: string | null } = {},
): RuntimeQualityRiskVm {
  const projectId = filters.projectId ?? null;
  const evidenceReports = Array.from(store.evidenceReports.values()).filter(
    (report) => !projectId || report.projectId === projectId,
  );
  const events = Array.from(store.runEvents.values()).filter(
    (event) => !projectId || event.projectId === projectId,
  );
  const runCount = Math.max(evidenceReports.length, Array.from(store.runs.values()).filter(
    (run) => !projectId || run.projectId === projectId,
  ).length);
  const successCount = evidenceReports.filter((report) => report.finalStatus === "success").length;
  const failedCount = evidenceReports.filter((report) => report.finalStatus === "failure").length;
  const blockedCount = evidenceReports.filter((report) => report.finalStatus === "blocked").length;
  const hookTotal = evidenceReports.reduce((sum, report) => sum + report.hookResults.length, 0);
  const hookBlocked = evidenceReports.reduce((sum, report) => sum + report.hookResults.filter(isBlockingResult).length, 0);
  const testTotal = evidenceReports.reduce((sum, report) => sum + report.testResults.length, 0);
  const testPassed = evidenceReports.reduce((sum, report) => sum + report.testResults.filter(isSuccessResult).length, 0);
  const repairTotal = evidenceReports.reduce((sum, report) => sum + report.repairResults.length, 0);
  const repairSuccess = evidenceReports.reduce((sum, report) => sum + report.repairResults.filter(isSuccessResult).length, 0);
  const highRiskEvents = events.filter((event) => isRiskEvent(event));

  return {
    quality: {
      timeRangeLabel: "当前 Collector 内存窗口",
      projectId,
      cards: [
        metric("任务成功率", percent(successCount, runCount), `${successCount}/${runCount || 0}`),
        metric("Hook 阻塞率", percent(hookBlocked, hookTotal), `${hookBlocked}/${hookTotal || 0}`),
        metric("测试通过率", percent(testPassed, testTotal), `${testPassed}/${testTotal || 0}`),
        metric("自动修复成功率", percent(repairSuccess, repairTotal), `${repairSuccess}/${repairTotal || 0}`),
        metric("平均修复次数", averageRepairAttempts(evidenceReports), `分母 ${evidenceReports.length}`),
        metric("失败任务数", String(failedCount), "finalStatus=failure"),
        metric("阻塞任务数", String(blockedCount), "finalStatus=blocked"),
        metric("最近运行趋势", String(events.length), "按事件数展示"),
      ],
      trend: evidenceReports.map((report, index) => ({
        label: report.runId,
        value: index + 1,
        status: report.finalStatus,
      })),
    },
    risk: {
      filters: {
        projectId,
        eventTypes: Array.from(new Set(highRiskEvents.map((event) => event.type))).sort(),
        severities: Array.from(new Set(highRiskEvents.map((event) => event.level))).sort(),
      },
      events: highRiskEvents.map((event) => ({
        id: event.id,
        runId: event.runId,
        projectId: event.projectId,
        eventType: event.type,
        severity: event.level,
        stage: event.stage || "unknown",
        summary: summarizeEvent(event),
        occurredAt: event.createdAt,
      })),
    },
  };
}

function eventsForRun(store: CollectorStore, runId: string) {
  return Array.from(store.runEvents.values())
    .filter((event) => event.runId === runId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function buildRuntimeResults(evidence: VisualEvidenceReportRecord | undefined): RunRuntimeResultsVm {
  if (!evidence) {
    return {
      changedFiles: [],
      hookResults: [],
      testResults: [],
      repairResults: [],
      reviewResults: [],
      finalStatus: "unknown",
      blockerCount: 0,
      maxRepairAttempts: 0,
    };
  }
  const hookResults = evidence.hookResults.map((item, index) => resultItem(item, index, "hook"));
  const testResults = evidence.testResults.map((item, index) => resultItem(item, index, "test"));
  const repairResults = evidence.repairResults.map((item, index) => resultItem(item, index, "repair"));
  const reviewResults = evidence.reviewResults.map((item, index) => resultItem(item, index, "review"));
  const changedFiles = evidence.changedFiles.map((item, index) => resultItem(item, index, "file"));
  const all = [...hookResults, ...testResults, ...repairResults, ...reviewResults];
  return {
    changedFiles,
    hookResults,
    testResults,
    repairResults,
    reviewResults,
    finalStatus: evidence.finalStatus,
    blockerCount: all.filter((item) => item.blocking).length,
    maxRepairAttempts: maxRepairAttempts(evidence.repairResults),
  };
}

function buildAgentCollaboration(
  events: VisualRuntimeEventRecord[],
  evidence: VisualEvidenceReportRecord | undefined,
): RunAgentCollaborationVm {
  const items = events
    .map((event, index) => {
      const payload = asRecord(event.payload);
      const metadata = asRecord(payload.metadata);
      const role = asString(metadata.agentRole) || asString(metadata.role) || asString(payload.agentRole);
      if (!role) return null;
      return {
        id: event.id,
        role,
        status: event.state || event.level,
        order: index + 1,
        inputSummary: asString(metadata.inputSummary) || asString(payload.inputSummary) || "未上报输入摘要",
        outputSummary: asString(metadata.outputSummary) || asString(payload.outputSummary) || summarizeEvent(event),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const conflicts = events
    .filter((event) => event.type.includes("conflict") || event.type.includes("dispute"))
    .map(summarizeEvent);
  const humanGates = events
    .filter((event) => event.type.includes("gate") || event.type.includes("approval"))
    .map((event) => event.stage || event.type);

  return {
    summary: items.length > 0 ? `共 ${items.length} 个 Agent 协作节点。` : "本次运行未上报 Agent 协作节点。",
    items,
    conflicts,
    humanGates,
    finalDecision: evidence?.finalStatus ?? events.at(-1)?.state ?? "unknown",
  };
}

function resultItem(item: unknown, index: number, fallback: string): RunRuntimeResultItemVm {
  const record = asRecord(item);
  const status = asString(record.status) || asString(record.finalStatus) || "unknown";
  return {
    id: `${fallback}:${index}`,
    label:
      asString(record.hookId) ||
      asString(record.command) ||
      asString(record.reviewer) ||
      asString(record.path) ||
      `${fallback}-${index + 1}`,
    status,
    summary:
      asString(record.summary) ||
      asString(record.message) ||
      asString(record.reason) ||
      "未提供摘要",
    meta:
      asString(record.durationMs) ||
      asString(record.changeType) ||
      asString(record.attempt) ||
      "",
    blocking: record.blocking === true || status === "blocked" || status === "failure",
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function summarizeEvent(event: VisualRuntimeEventRecord) {
  const payload = asRecord(event.payload);
  return asString(payload.message) || JSON.stringify(payload).slice(0, 200) || event.type;
}

function classifyEventCategory(eventType: string): RunTraceEvent["category"] {
  const value = eventType.toLowerCase();
  if (value.startsWith("control.") || value.includes("approval")) return "control";
  if (value.includes("receipt")) return "receipt";
  if (value.startsWith("run.") || value.includes("state")) return "state";
  return "other";
}

function formatRunDuration(startedAt: string, updatedAt: string) {
  return formatDuration(
    Math.max(0, new Date(updatedAt).getTime() - new Date(startedAt).getTime()),
  );
}

function agentLabelFromEvents(events: VisualRuntimeEventRecord[]) {
  return buildAgentCollaboration(events, undefined).items.at(-1)?.role ?? "";
}

function isSuccessResult(value: unknown) {
  return asString(asRecord(value).status) === "success";
}

function isBlockingResult(value: unknown) {
  const record = asRecord(value);
  const status = asString(record.status);
  return record.blocking === true || status === "blocked" || status === "failure";
}

function isRiskEvent(event: VisualRuntimeEventRecord) {
  const type = event.type.toLowerCase();
  return (
    event.level === "blocking" ||
    event.level === "error" ||
    type.includes("security") ||
    type.includes("privacy") ||
    type.includes("policy") ||
    type.includes("denied") ||
    type.includes("exception")
  );
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function metric(label: string, value: string, note: string): MetricVm {
  return { label, value, note };
}

function averageRepairAttempts(reports: VisualEvidenceReportRecord[]) {
  if (reports.length === 0) return "0";
  const total = reports.reduce((sum, report) => sum + report.repairResults.length, 0);
  return (total / reports.length).toFixed(1);
}

function maxRepairAttempts(results: unknown[]): number {
  return results.reduce<number>((max, item, index) => {
    const attempt = Number(asRecord(item).attempt ?? index + 1);
    return Number.isFinite(attempt) ? Math.max(max, attempt) : max;
  }, 0);
}
