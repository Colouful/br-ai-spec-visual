import { describe, expect, it } from "vitest";

import {
  classifySpecAssetPath,
  summarizeSpecAssets,
} from "@/lib/spec-assets";

describe("classifySpecAssetPath", () => {
  it("识别 openspec 正式资产", () => {
    expect(
      classifySpecAssetPath(
        "openspec/changes/add-product-card/proposal.md",
      ),
    ).toMatchObject({
      sourceKind: "openspec",
      assetType: "proposal",
      changeId: "add-product-card",
      runId: null,
    });
  });

  it("识别 ai-spec history 轻量资产", () => {
    expect(
      classifySpecAssetPath(
        ".ai-spec/history/run_20260424_001/implementation-notes.md",
      ),
    ).toMatchObject({
      sourceKind: "ai-spec-history",
      assetType: "implementation-notes",
      runId: "run_20260424_001",
    });
  });

  it("忽略无关路径", () => {
    expect(classifySpecAssetPath("docs/readme.md")).toBeNull();
  });
});

describe("summarizeSpecAssets", () => {
  it("按来源和待审数量聚合资产摘要", () => {
    const summary = summarizeSpecAssets([
      {
        id: "asset-1",
        sourceKind: "openspec",
        sourcePath: "openspec/changes/change-1/proposal.md",
        assetType: "proposal",
        status: "active",
      },
      {
        id: "asset-2",
        sourceKind: "openspec",
        sourcePath: "openspec/changes/change-1/tasks.md",
        assetType: "tasks",
        status: "reviewing",
      },
      {
        id: "asset-3",
        sourceKind: "ai-spec-history",
        sourcePath:
          ".ai-spec/history/run_20260424_001/implementation-notes.md",
        assetType: "implementation-notes",
        status: "history",
      },
    ]);

    expect(summary).toEqual({
      total: 3,
      openspec: 2,
      history: 1,
      reviewing: 1,
    });
  });
});
