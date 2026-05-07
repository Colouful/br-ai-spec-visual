import { badRequest } from "./errors";
import { defaultPrivacyGuard, type PrivacyGuard } from "./privacy-guard";
import {
  createRecordId,
  defaultCollectorStore,
  nowIsoString,
  type CollectorStore,
} from "./repository";
import type { VisualRunRecord, VisualRuntimeEventRecord } from "./types";

export class RunEventService {
  constructor(
    private readonly store: CollectorStore = defaultCollectorStore,
    private readonly privacyGuard: PrivacyGuard = defaultPrivacyGuard,
  ) {}

  collect(input: Record<string, unknown>) {
    this.privacyGuard.assertSafe(input);
    const eventId = String(input.eventId ?? "");
    const runId = String(input.runId ?? "");
    const projectId = String(input.projectId ?? "");
    if (!eventId) throw badRequest("eventId 为必填字段。");
    if (!runId) throw badRequest("runId 为必填字段。");
    if (!projectId) throw badRequest("projectId 为必填字段。");

    const existingEvent = this.store.runEvents.get(eventId);
    if (existingEvent) {
      return {
        event: existingEvent,
        run: this.store.runs.get(runId),
        idempotent: true,
      };
    }

    const timestamp = nowIsoString();
    const type = String(input.type ?? input.eventType ?? "");
    if (!type) throw badRequest("eventType 为必填字段。");
    const occurredAt = input.occurredAt
      ? String(input.occurredAt)
      : input.timestamp
        ? String(input.timestamp)
        : timestamp;
    const event: VisualRuntimeEventRecord = {
      id: createRecordId("vevt"),
      eventId,
      runId,
      projectId,
      type,
      stage: input.stage ? String(input.stage) : null,
      state: input.state ? String(input.state) : input.status ? String(input.status) : null,
      level: String(input.level ?? input.severity ?? "info"),
      payload: buildPayload(input),
      createdAt: occurredAt,
    };
    this.store.runEvents.set(eventId, event);

    const run = this.upsertRun(input, event, timestamp);
    return { event, run, idempotent: false };
  }

  private upsertRun(
    input: Record<string, unknown>,
    event: VisualRuntimeEventRecord,
    timestamp: string,
  ): VisualRunRecord {
    const existing = this.store.runs.get(event.runId);
    const manifest = asObject(input.manifest);
    const payload = asObject(input.payload);
    const type = event.type;
    const state = String(input.state ?? inferRunState(type, existing?.state));
    const run: VisualRunRecord = {
      id: existing?.id ?? createRecordId("vrun"),
      runId: event.runId,
      projectId: event.projectId,
      workspaceId: input.workspaceId ? String(input.workspaceId) : existing?.workspaceId ?? null,
      requirementSummary: input.requirementSummary
        ? String(input.requirementSummary)
        : existing?.requirementSummary ?? null,
      state,
      stage: String(input.stage ?? existing?.stage ?? "initialized"),
      executor: input.executor ? String(input.executor) : existing?.executor ?? null,
      manifest: Object.keys(manifest).length > 0 ? manifest : existing?.manifest ?? {},
      branch: existing?.branch ?? {},
      worktree: existing?.worktree ?? {},
      contextSummary: existing?.contextSummary ?? {},
      verificationSummary: type === "executor_completed"
        ? payload
        : existing?.verificationSummary ?? {},
      startedAt: existing?.startedAt ?? (isRunStarted(type) ? event.createdAt : null),
      completedAt: isRunFinished(type) ? event.createdAt : existing?.completedAt ?? null,
      durationMs: typeof input.durationMs === "number" ? input.durationMs : existing?.durationMs ?? null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    this.store.runs.set(event.runId, run);
    const project = this.store.projects.get(event.projectId);
    if (project) {
      project.lastRunId = event.runId;
      project.updatedAt = timestamp;
      this.store.projects.set(event.projectId, project);
    }
    return run;
  }
}

function buildPayload(input: Record<string, unknown>): Record<string, unknown> {
  const payload = asObject(input.payload);
  if (Object.keys(payload).length > 0) return payload;
  const metadata = asObject(input.metadata);
  return {
    ...(input.message ? { message: String(input.message) } : {}),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  };
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isRunStarted(type: string) {
  return type === "spec_started" || type === "run.started";
}

function isRunFinished(type: string) {
  return type === "run_completed" || type === "run.finished";
}

function inferRunState(type: string, existingState: string | undefined) {
  if (isRunFinished(type)) return "completed";
  return existingState ?? "running";
}
