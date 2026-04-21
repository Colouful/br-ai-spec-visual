import type { DataSourceFileInput } from "@/lib/contracts/data-source";
import type { JsonRecord, RawIngestEventDraft } from "@/lib/contracts/ingest";
import {
  hashText,
  hashValue,
  parseJsonLines,
  readString,
} from "@/lib/ingest/source-utils";

function inferEventKey(record: JsonRecord, lineIndex: number) {
  return (
    readString(record, "turn_id") ??
    readString(record, "session_id") ??
    `${readString(record, "type") ?? readString(record, "event") ?? "event"}:${lineIndex}`
  );
}

export function parseOmxJsonlSource(
  input: DataSourceFileInput,
): RawIngestEventDraft[] {
  const sourcePath = input.sourcePath ?? input.filePath;

  if (!sourcePath) {
    throw new Error("omx 数据源缺少 sourcePath/filePath");
  }

  return parseJsonLines(input.content).map((record, lineIndex) => {
    const checksum = hashValue(record);
    const eventType =
      readString(record, "type") ?? readString(record, "event") ?? "unknown";
    const eventKey = inferEventKey(record, lineIndex);
    const dedupeKey = hashText(
      ["omx-jsonl", sourcePath, eventKey, checksum].join("|"),
    );

    return {
      workspaceId: input.workspaceId ?? null,
      sourceKind: "omx-jsonl",
      sourcePath,
      eventType,
      eventKey,
      dedupeKey,
      checksum,
      occurredAt:
        readString(record, "timestamp") ?? readString(record, "_ts") ?? null,
      entityType:
        readString(record, "turn_id") !== undefined ? "omx-turn" : "omx-session",
      entityId:
        readString(record, "turn_id") ??
        readString(record, "session_id") ??
        null,
      payload: record,
    } satisfies RawIngestEventDraft;
  });
}

export function parseOmxLogFile(input: DataSourceFileInput) {
  const rawEvents = parseOmxJsonlSource(input);

  return {
    turns: rawEvents
      .filter((rawEvent) => typeof rawEvent.payload.turn_id === "string")
      .map((rawEvent) => ({
        workspaceId: rawEvent.workspaceId ?? null,
        threadId:
          typeof rawEvent.payload.thread_id === "string"
            ? rawEvent.payload.thread_id
            : "",
        turnId:
          typeof rawEvent.payload.turn_id === "string"
            ? rawEvent.payload.turn_id
            : "",
        type: rawEvent.eventType,
        timestamp: rawEvent.occurredAt ?? null,
      })),
    sessions: rawEvents
      .filter((rawEvent) => typeof rawEvent.payload.session_id === "string")
      .map((rawEvent) => ({
        workspaceId: rawEvent.workspaceId ?? null,
        sessionId:
          typeof rawEvent.payload.session_id === "string"
            ? rawEvent.payload.session_id
            : "",
        nativeSessionId:
          typeof rawEvent.payload.native_session_id === "string"
            ? rawEvent.payload.native_session_id
            : null,
        event: rawEvent.eventType,
        timestamp: rawEvent.occurredAt ?? null,
      })),
  };
}
