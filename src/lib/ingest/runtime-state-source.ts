import type { DataSourceFileInput } from "@/lib/contracts/data-source";
import type { RawIngestEventDraft } from "@/lib/contracts/ingest";
import {
  hashText,
  hashValue,
  isJsonRecord,
  parseJsonRecord,
  readString,
} from "@/lib/ingest/source-utils";

export function parseRuntimeStateSource(
  input: DataSourceFileInput,
): RawIngestEventDraft[] {
  const sourcePath = input.sourcePath ?? input.filePath;
  if (!sourcePath) {
    throw new Error("runtime-state 数据源缺少 sourcePath/filePath");
  }

  const record = parseJsonRecord(input.content, sourcePath);
  const runId = readString(record, "run_id");
  if (!runId) {
    throw new Error(`${sourcePath} 缺少 run_id`);
  }

  const timestamps = isJsonRecord(record.timestamps) ? record.timestamps : null;
  const updatedAt = readString(timestamps ?? {}, "updated_at") ?? null;
  const checksum = hashValue(record);
  const eventKey = `${runId}:${updatedAt ?? "unknown"}:${checksum.slice(0, 12)}`;

  return [
    {
      workspaceId: input.workspaceId ?? null,
      sourceKind: "run-state-json",
      sourcePath,
      eventType: "runtime-state.snapshot",
      eventKey,
      dedupeKey: hashText(["run-state-json", sourcePath, eventKey, checksum].join("|")),
      checksum,
      occurredAt: updatedAt,
      entityType: "run-state",
      entityId: runId,
      payload: record,
    },
  ];
}
