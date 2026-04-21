import type {
  RawIngestEventDraft,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { readNumber, readString } from "@/lib/ingest/source-utils";

export function projectOmxRawEvent(
  rawEvent: RawIngestEventDraft | StoredRawIngestEvent,
) {
  const rawEventId = "id" in rawEvent ? rawEvent.id : rawEvent.dedupeKey;
  const batch = createEmptyProjectionBatch();
  const turnId = readString(rawEvent.payload, "turn_id");
  const threadId = readString(rawEvent.payload, "thread_id");
  const sessionId = readString(rawEvent.payload, "session_id");

  if (turnId && threadId) {
    batch.omxSessions.push({
      workspaceId: rawEvent.workspaceId ?? null,
      sessionKey: threadId,
      nativeSessionId: null,
      pid: null,
      status: "active",
      startedAt: null,
      lastSeenAt: rawEvent.occurredAt ?? null,
      rawEventId,
      payload: rawEvent.payload,
    });

    batch.omxTurns.push({
      workspaceId: rawEvent.workspaceId ?? null,
      sessionKey: threadId,
      turnKey: turnId,
      eventType: rawEvent.eventType,
      occurredAt: rawEvent.occurredAt ?? null,
      inputPreview: readString(rawEvent.payload, "input_preview") ?? null,
      outputPreview: readString(rawEvent.payload, "output_preview") ?? null,
      rawEventId,
      payload: rawEvent.payload,
    });

    batch.runEvents.push({
      workspaceId: rawEvent.workspaceId ?? null,
      runKey: threadId,
      eventKey: rawEvent.eventKey,
      eventType: rawEvent.eventType,
      occurredAt: rawEvent.occurredAt ?? null,
      sourceKind: rawEvent.sourceKind,
      rawEventId,
      payload: rawEvent.payload,
    });

    batch.runStates.push({
      workspaceId: rawEvent.workspaceId ?? null,
      runKey: threadId,
      status: "active",
      lastEventType: rawEvent.eventType,
      lastEventAt: rawEvent.occurredAt ?? null,
      turnCount: 1,
      sourceKind: rawEvent.sourceKind,
      rawEventId,
      payload: rawEvent.payload,
    });

    return batch;
  }

  if (sessionId) {
    batch.omxSessions.push({
      workspaceId: rawEvent.workspaceId ?? null,
      sessionKey: sessionId,
      nativeSessionId: readString(rawEvent.payload, "native_session_id") ?? null,
      pid: readNumber(rawEvent.payload, "pid") ?? null,
      status: rawEvent.eventType === "session_start" ? "active" : "observed",
      startedAt: rawEvent.occurredAt ?? null,
      lastSeenAt: rawEvent.occurredAt ?? null,
      rawEventId,
      payload: rawEvent.payload,
    });

    batch.runEvents.push({
      workspaceId: rawEvent.workspaceId ?? null,
      runKey: sessionId,
      eventKey: rawEvent.eventKey,
      eventType: rawEvent.eventType,
      occurredAt: rawEvent.occurredAt ?? null,
      sourceKind: rawEvent.sourceKind,
      rawEventId,
      payload: rawEvent.payload,
    });

    batch.runStates.push({
      workspaceId: rawEvent.workspaceId ?? null,
      runKey: sessionId,
      status: rawEvent.eventType === "session_start" ? "active" : "observed",
      lastEventType: rawEvent.eventType,
      lastEventAt: rawEvent.occurredAt ?? null,
      turnCount: 0,
      sourceKind: rawEvent.sourceKind,
      rawEventId,
      payload: rawEvent.payload,
    });
  }

  return batch;
}
