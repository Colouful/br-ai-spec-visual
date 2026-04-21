import type {
  RawIngestEventDraft,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { isJsonRecord, readString, readStringArray } from "@/lib/ingest/source-utils";

function normalizeRunStatus(value: string | null | undefined) {
  if (!value) return "running";
  if (value === "success") return "completed";
  return value;
}

export function projectRuntimeStateRawEvent(
  rawEvent: RawIngestEventDraft | StoredRawIngestEvent,
) {
  const rawEventId = "id" in rawEvent ? rawEvent.id : rawEvent.dedupeKey;
  const batch = createEmptyProjectionBatch();
  const payload = rawEvent.payload;
  const runId = readString(payload, "run_id");

  if (!runId) {
    return batch;
  }

  const task = isJsonRecord(payload.task) ? payload.task : null;
  const flow = isJsonRecord(payload.flow) ? payload.flow : null;
  const plan = isJsonRecord(payload.plan) ? payload.plan : null;
  const artifacts = isJsonRecord(payload.artifacts) ? payload.artifacts : null;
  const timestamps = isJsonRecord(payload.timestamps) ? payload.timestamps : null;
  const events = Array.isArray(payload.events) ? payload.events.filter(isJsonRecord) : [];
  const lastEvent = events.at(-1);

  batch.runStates.push({
    workspaceId: rawEvent.workspaceId ?? null,
    runKey: runId,
    status: normalizeRunStatus(readString(payload, "status")),
    lastEventType:
      readString(lastEvent ?? {}, "type") ??
      rawEvent.eventType,
    lastEventAt:
      readString(lastEvent ?? {}, "at") ??
      readString(timestamps ?? {}, "updated_at") ??
      rawEvent.occurredAt ??
      null,
    turnCount: events.length,
    sourceKind: rawEvent.sourceKind,
    rawEventId,
    payload,
  });

  for (const event of events) {
    const eventType = readString(event, "type");
    if (!eventType) continue;
    const occurredAt = readString(event, "at") ?? rawEvent.occurredAt ?? null;
    batch.runEvents.push({
      workspaceId: rawEvent.workspaceId ?? null,
      runKey: runId,
      eventKey: `${runId}:${eventType}:${occurredAt ?? "unknown"}`,
      eventType,
      occurredAt,
      sourceKind: rawEvent.sourceKind,
      rawEventId,
      payload: event,
    });
  }

  const changeKey = readString(task ?? {}, "change_id");
  if (changeKey && artifacts) {
    for (const [docType, sourcePath] of Object.entries(artifacts)) {
      if (typeof sourcePath !== "string" || !sourcePath) continue;
      batch.changeDocuments.push({
        workspaceId: rawEvent.workspaceId ?? null,
        changeKey,
        docType,
        title: readString(payload, "run_id"),
        sourcePath,
        contentHash: rawEvent.checksum,
        status: normalizeRunStatus(readString(payload, "status")),
        rawEventId,
        payload: {
          flow_id: readString(flow ?? {}, "id"),
          current_role: readString(payload, "current_role"),
          pending_gate: readString(payload, "pending_gate"),
          required_roles: readStringArray(plan ?? {}, "required_roles"),
        },
      });
    }
  }

  return batch;
}
