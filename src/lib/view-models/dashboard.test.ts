import { describe, expect, it } from "vitest";

import {
  calculateAssetCompletionScore,
  resolveBlockerReason,
  resolveOnboardingStage,
  type WorkspaceAssetSnapshot,
} from "./dashboard-shared";

function createSnapshot(
  overrides: Partial<WorkspaceAssetSnapshot> = {},
): WorkspaceAssetSnapshot {
  return {
    hasRules: false,
    hasSkills: false,
    hasOpenSpec: false,
    hasAiSpec: false,
    hasRegistry: false,
    hasHubLock: false,
    hasLogs: false,
    hasVisualBridge: false,
    ...overrides,
  };
}

describe("resolveOnboardingStage", () => {
  it("returns 未接入 when base assets are missing", () => {
    expect(
      resolveOnboardingStage({
        assets: createSnapshot(),
        runCount: 0,
        archiveCount: 0,
      }).label,
    ).toBe("未接入");
  });

  it("returns 已接入 when base assets exist but visual is not connected", () => {
    expect(
      resolveOnboardingStage({
        assets: createSnapshot({
          hasRules: true,
          hasSkills: true,
          hasAiSpec: true,
        }),
        runCount: 0,
        archiveCount: 0,
      }).label,
    ).toBe("已接入");
  });

  it("returns 已联通 Visual when bridge exists but no run has completed", () => {
    expect(
      resolveOnboardingStage({
        assets: createSnapshot({
          hasRules: true,
          hasSkills: true,
          hasAiSpec: true,
          hasVisualBridge: true,
        }),
        runCount: 0,
        archiveCount: 0,
      }).label,
    ).toBe("已联通 Visual");
  });

  it("returns 已跑通需求 when a run exists but archive has not happened", () => {
    expect(
      resolveOnboardingStage({
        assets: createSnapshot({
          hasRules: true,
          hasSkills: true,
          hasAiSpec: true,
          hasVisualBridge: true,
        }),
        runCount: 1,
        archiveCount: 0,
      }).label,
    ).toBe("已跑通需求");
  });

  it("returns 已归档 when at least one archive exists", () => {
    expect(
      resolveOnboardingStage({
        assets: createSnapshot({
          hasRules: true,
          hasSkills: true,
          hasAiSpec: true,
          hasVisualBridge: true,
        }),
        runCount: 1,
        archiveCount: 1,
      }).label,
    ).toBe("已归档");
  });
});

describe("calculateAssetCompletionScore", () => {
  it("returns 0 when no asset is detected", () => {
    expect(calculateAssetCompletionScore(createSnapshot())).toBe(0);
  });

  it("returns 100 when every asset is detected", () => {
    expect(
      calculateAssetCompletionScore(
        createSnapshot({
          hasRules: true,
          hasSkills: true,
          hasOpenSpec: true,
          hasAiSpec: true,
          hasRegistry: true,
          hasHubLock: true,
          hasLogs: true,
          hasVisualBridge: true,
        }),
      ),
    ).toBe(100);
  });
});

describe("resolveBlockerReason", () => {
  it("prefers pending gate as the blocker reason", () => {
    expect(
      resolveBlockerReason({
        pendingGate: "before-archive",
        lastEventType: "run.state_changed",
        status: "running",
      }),
    ).toContain("before-archive");
  });

  it("falls back to failure status when no gate exists", () => {
    expect(
      resolveBlockerReason({
        pendingGate: null,
        lastEventType: "run.failed",
        status: "failed",
      }),
    ).toBe("运行失败，等待人工处理");
  });
});
