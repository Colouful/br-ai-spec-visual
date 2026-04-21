import type { ProjectionBatch, StoredRawIngestEvent } from "@/lib/contracts/ingest";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { projectOmxRawEvent } from "@/lib/projectors/omx-projector";
import { projectRegistryRawEvent } from "@/lib/projectors/registry-projector";
import { projectRuntimeStateRawEvent } from "@/lib/projectors/runtime-state-projector";
import { projectControlReceiptRawEvent } from "@/lib/projectors/control-receipt-projector";
import { projectHookEventRawEvent } from "@/lib/projectors/hook-event-projector";

export function projectRawEvent(rawEvent: StoredRawIngestEvent): ProjectionBatch {
  switch (rawEvent.sourceKind) {
    case "registry-json":
      return projectRegistryRawEvent(rawEvent);
    case "omx-jsonl":
      return projectOmxRawEvent(rawEvent);
    case "run-state-json":
      return projectRuntimeStateRawEvent(rawEvent);
    case "control-receipt":
      return projectControlReceiptRawEvent(rawEvent);
    case "hook-event":
      return projectHookEventRawEvent(rawEvent);
    default:
      return createEmptyProjectionBatch();
  }
}
