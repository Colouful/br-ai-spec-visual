import type {
  RawIngestEventDraft,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { isJsonRecord, readString } from "@/lib/ingest/source-utils";
import { projectRuntimeStateRawEvent } from "@/lib/projectors/runtime-state-projector";

/**
 * 处理来自 auto 侧 visual-hooks/push-client.js 的事件：
 *   - run.started
 *   - run.state_changed
 *   - run.archived
 *
 * 复用 runtime-state-projector 的核心逻辑（payload 结构与 .ai-spec/current-run.json
 * 一致），并补充 `run.started` 的最小骨架。
 */
export function projectHookEventRawEvent(
  rawEvent: RawIngestEventDraft | StoredRawIngestEvent,
) {
  const rawEventId = "id" in rawEvent ? rawEvent.id : rawEvent.dedupeKey;
  const payload = rawEvent.payload;
  if (!isJsonRecord(payload)) {
    return createEmptyProjectionBatch();
  }

  const eventType = rawEvent.eventType;
  const runId = readString(payload, "run_id");

  if (!runId) {
    return createEmptyProjectionBatch();
  }

  if (eventType === "run.state_changed" || eventType === "run.archived") {
    return projectRuntimeStateRawEvent({
      ...rawEvent,
      sourceKind: "run-state-json" as const,
    });
  }

  const batch = createEmptyProjectionBatch();
  batch.runStates.push({
    workspaceId: rawEvent.workspaceId ?? null,
    runKey: runId,
    status: eventType === "run.started" ? "running" : "unknown",
    lastEventType: eventType,
    lastEventAt: rawEvent.occurredAt ?? null,
    turnCount: 0,
    sourceKind: rawEvent.sourceKind,
    rawEventId,
    payload,
  });
  batch.runEvents.push({
    workspaceId: rawEvent.workspaceId ?? null,
    runKey: runId,
    eventKey: `${runId}:${eventType}:${rawEvent.occurredAt ?? "now"}`,
    eventType,
    occurredAt: rawEvent.occurredAt ?? null,
    sourceKind: rawEvent.sourceKind,
    rawEventId,
    payload,
  });

  return batch;
}
