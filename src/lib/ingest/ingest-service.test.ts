/* @vitest-environment node */

import { describe, expect, it } from "vitest";

import { ingestRawEvents } from "@/lib/ingest/ingest-service";
import { parseRegistrySource } from "@/lib/ingest/registry-source";
import { InMemoryIngestRepository } from "@/lib/repositories/in-memory-ingest-repository";

const registryFixtureV1 = JSON.stringify(
  {
    version: 1,
    skills: {
      "archive-change": {
        source: ".agents/skills/common/archive-change/SKILL.md",
        domains: ["documentation"],
      },
    },
  },
  null,
  2,
);

const registryFixtureV2 = JSON.stringify(
  {
    version: 2,
    skills: {
      "archive-change": {
        source: ".agents/skills/common/archive-change/SKILL.md",
        domains: ["documentation", "workflow"],
      },
    },
  },
  null,
  2,
);

describe("ingestRawEvents", () => {
  it("deduplicates raw ingest events by idempotency key", async () => {
    const repository = new InMemoryIngestRepository();
    const rawEvents = parseRegistrySource({
      sourcePath: ".agents/registry/skills.json",
      content: registryFixtureV1,
    });

    const first = await ingestRawEvents({
      repository,
      rawEvents,
    });
    const second = await ingestRawEvents({
      repository,
      rawEvents,
    });

    expect(first).toMatchObject({
      insertedRawCount: 1,
      skippedRawCount: 0,
    });
    expect(second).toMatchObject({
      insertedRawCount: 0,
      skippedRawCount: 1,
    });

    const snapshot = repository.snapshot();

    expect(snapshot.rawIngestEvents).toHaveLength(1);
    expect(snapshot.registryItems).toHaveLength(1);
  });

  it("upserts projections instead of duplicating logical registry items", async () => {
    const repository = new InMemoryIngestRepository();

    await ingestRawEvents({
      repository,
      rawEvents: parseRegistrySource({
        sourcePath: ".agents/registry/skills.json",
        content: registryFixtureV1,
      }),
    });

    await ingestRawEvents({
      repository,
      rawEvents: parseRegistrySource({
        sourcePath: ".agents/registry/skills.json",
        content: registryFixtureV2,
      }),
    });

    const snapshot = repository.snapshot();

    expect(snapshot.rawIngestEvents).toHaveLength(2);
    expect(snapshot.registryItems).toHaveLength(1);
    expect(snapshot.registryItems[0]).toMatchObject({
      slug: "archive-change",
      version: 2,
    });
    expect(snapshot.registryItems[0].payload).toMatchObject({
      domains: ["documentation", "workflow"],
    });
  });
});
