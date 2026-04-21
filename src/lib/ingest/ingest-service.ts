import type {
  IngestRawEventsResult,
  IngestRepository,
  RawIngestEventDraft,
} from "@/lib/contracts/ingest";
import { projectRawEvent } from "@/lib/projectors";

export interface IngestRawEventsInput {
  repository: IngestRepository;
  rawEvents: RawIngestEventDraft[];
}

export async function ingestRawEvents(
  input: IngestRawEventsInput,
): Promise<IngestRawEventsResult> {
  const result: IngestRawEventsResult = {
    insertedRawCount: 0,
    skippedRawCount: 0,
    projectedRawCount: 0,
  };

  for (const rawEvent of input.rawEvents) {
    const persisted = await input.repository.persistRawEvent(rawEvent);

    if (!persisted.inserted) {
      result.skippedRawCount += 1;
      continue;
    }

    result.insertedRawCount += 1;

    const projection = projectRawEvent(persisted.record);

    await input.repository.applyProjection(projection);
    await input.repository.markRawEventProjected(persisted.record.id);

    result.projectedRawCount += 1;
  }

  return result;
}
