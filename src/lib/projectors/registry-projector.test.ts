/* @vitest-environment node */

import { describe, expect, it } from "vitest";

import { parseRegistrySource } from "@/lib/ingest/registry-source";
import { projectRegistryRawEvent } from "@/lib/projectors/registry-projector";

const skillsFixture = JSON.stringify(
  {
    version: 1,
    skills: {
      "archive-change": {
        source: ".agents/skills/common/archive-change/SKILL.md",
        domains: ["documentation"],
      },
      "create-proposal": {
        source: ".agents/skills/common/create-proposal/SKILL.md",
        domains: ["planning"],
      },
    },
  },
  null,
  2,
);

describe("projectRegistryRawEvent", () => {
  it("maps registry items into raw ingest events and registry item projections", () => {
    const rawEvents = parseRegistrySource({
      sourcePath: ".agents/registry/skills.json",
      content: skillsFixture,
    });

    expect(rawEvents).toHaveLength(2);

    const projection = projectRegistryRawEvent(rawEvents[0]);

    expect(projection.registryItems).toHaveLength(1);
    expect(projection.registryItems[0]).toMatchObject({
      registry: "agents",
      itemType: "skill",
      slug: "archive-change",
      name: "archive-change",
      version: 1,
      sourcePath: ".agents/skills/common/archive-change/SKILL.md",
    });
    expect(projection.registryItems[0].payload).toMatchObject({
      domains: ["documentation"],
    });
  });
});
