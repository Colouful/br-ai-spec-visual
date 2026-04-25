import { badRequest } from "./errors";
import { defaultPrivacyGuard, type PrivacyGuard } from "./privacy-guard";
import {
  createRecordId,
  defaultCollectorStore,
  nowIsoString,
  type CollectorStore,
} from "./repository";
import type { VisualIncidentRecord } from "./types";

export class IncidentService {
  constructor(
    private readonly store: CollectorStore = defaultCollectorStore,
    private readonly privacyGuard: PrivacyGuard = defaultPrivacyGuard,
  ) {}

  collect(input: Record<string, unknown>) {
    this.privacyGuard.assertSafe(input);
    const incidentId = String(input.incidentId ?? "");
    const runId = String(input.runId ?? "");
    const projectId = String(input.projectId ?? "");
    if (!incidentId) throw badRequest("incidentId 为必填字段。");
    if (!runId) throw badRequest("runId 为必填字段。");
    if (!projectId) throw badRequest("projectId 为必填字段。");

    const existing = this.store.incidents.get(incidentId);
    if (existing) {
      return { incident: existing, idempotent: true };
    }

    const timestamp = nowIsoString();
    const incident: VisualIncidentRecord = {
      id: createRecordId("vinc"),
      incidentId,
      runId,
      projectId,
      type: String(input.type ?? "unknown"),
      level: String(input.level ?? "warning"),
      stage: input.stage ? String(input.stage) : null,
      message: String(input.message ?? ""),
      suggestion: input.suggestion ? String(input.suggestion) : null,
      diagnoseResult: asObject(input.diagnoseResult),
      recoveryAction: asObject(input.recoveryAction),
      status: String(input.status ?? "open"),
      createdAt: input.createdAt ? String(input.createdAt) : timestamp,
      updatedAt: timestamp,
    };
    this.store.incidents.set(incidentId, incident);
    return { incident, idempotent: false };
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
