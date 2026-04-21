import type { ProjectionBatch, StoredRawIngestEvent } from "@/lib/contracts/ingest";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { projectOmxRawEvent } from "@/lib/projectors/omx-projector";
import { projectRegistryRawEvent } from "@/lib/projectors/registry-projector";
import { projectRuntimeStateRawEvent } from "@/lib/projectors/runtime-state-projector";

export function projectRawEvent(rawEvent: StoredRawIngestEvent): ProjectionBatch {
  switch (rawEvent.sourceKind) {
    case "registry-json":
      return projectRegistryRawEvent(rawEvent);
    case "omx-jsonl":
      return projectOmxRawEvent(rawEvent);
    case "run-state-json":
      return projectRuntimeStateRawEvent(rawEvent);
    default:
      return createEmptyProjectionBatch();
  }
}
