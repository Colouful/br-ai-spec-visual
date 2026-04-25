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
    const occurredAt = input.occurredAt ? String(input.occurredAt) : timestamp;
    const event: VisualRuntimeEventRecord = {
      id: createRecordId("vevt"),
      eventId,
      runId,
      projectId,
      type,
      stage: input.stage ? String(input.stage) : null,
      state: input.state ? String(input.state) : null,
      level: String(input.level ?? "info"),
      payload: asObject(input.payload),
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
    const run: VisualRunRecord = {
      id: existing?.id ?? createRecordId("vrun"),
      runId: event.runId,
      projectId: event.projectId,
      workspaceId: input.workspaceId ? String(input.workspaceId) : existing?.workspaceId ?? null,
      requirementSummary: input.requirementSummary
        ? String(input.requirementSummary)
        : existing?.requirementSummary ?? null,
      state: String(input.state ?? (type === "run_completed" ? "completed" : existing?.state ?? "running")),
      stage: String(input.stage ?? existing?.stage ?? "initialized"),
      executor: input.executor ? String(input.executor) : existing?.executor ?? null,
      manifest: Object.keys(manifest).length > 0 ? manifest : existing?.manifest ?? {},
      branch: existing?.branch ?? {},
      worktree: existing?.worktree ?? {},
      contextSummary: existing?.contextSummary ?? {},
      verificationSummary: type === "executor_completed"
        ? payload
        : existing?.verificationSummary ?? {},
      startedAt: existing?.startedAt ?? (type === "spec_started" ? event.createdAt : null),
      completedAt: type === "run_completed" ? event.createdAt : existing?.completedAt ?? null,
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

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
