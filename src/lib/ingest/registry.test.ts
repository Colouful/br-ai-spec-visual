import { describe, expect, it } from "vitest";

import { parseRegistryFile } from "./registry";

describe("parseRegistryFile", () => {
  it("normalizes role registry items and relations", () => {
    const content = JSON.stringify({
      version: 1,
      roles: {
        "task-orchestrator": {
          name: "任务主代理",
          status: "active",
          profiles: ["vue", "react"],
          domains: ["orchestration"],
          rule_ids: ["project-overview", "project-structure"],
          skill_priority: ["create-proposal"],
        },
      },
    });

    const result = parseRegistryFile({
      filePath: ".agents/registry/roles.json",
      content,
      workspaceId: "ws_1",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      workspaceId: "ws_1",
      category: "role",
      slug: "task-orchestrator",
      name: "任务主代理",
      status: "active",
    });
    expect(result.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceCategory: "role",
          sourceSlug: "task-orchestrator",
          relationType: "uses-rule",
          targetSlug: "project-overview",
        }),
        expect.objectContaining({
          sourceCategory: "role",
          sourceSlug: "task-orchestrator",
          relationType: "uses-skill",
          targetSlug: "create-proposal",
        }),
      ]),
    );
  });

  it("normalizes profile registry items", () => {
    const content = JSON.stringify({
      version: 1,
      profiles: {
        react: {
          status: "active",
          label: "React",
          aliases: [],
        },
      },
    });

    const result = parseRegistryFile({
      filePath: ".agents/registry/profiles.json",
      content,
      workspaceId: "ws_1",
    });

    expect(result.items[0]).toMatchObject({
      category: "profile",
      slug: "react",
      label: "React",
      status: "active",
    });
    expect(result.relations).toEqual([]);
  });
});
