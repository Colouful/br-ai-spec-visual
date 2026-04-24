import { describe, expect, it } from "vitest";

import {
  buildGovernanceSummary,
  type GovernanceWorkspaceSource,
} from "@/lib/view-models/governance";

describe("buildGovernanceSummary", () => {
  it("聚合多项目 OpenSpec 治理指标", () => {
    const summary = buildGovernanceSummary([
      {
        workspaceId: "ws-1",
        workspaceSlug: "workspace-1",
        workspaceName: "Workspace One",
        updatedAt: "2026-04-24T12:00:00.000Z",
        currentRoleCode: "frontend-implementer",
        currentRoleNameZh: "前端实现专家",
        activeChanges: ["change-a"],
        waitingReviewChanges: ["change-a"],
        pendingArchiveChanges: ["change-a"],
        archivedChanges: ["change-b"],
        specAssets: [
          { sourceKind: "openspec", updatedAt: "2026-04-24T12:00:00.000Z" },
          { sourceKind: "ai-spec-history", updatedAt: "2026-04-23T12:00:00.000Z" },
        ],
        hasBlockingGate: true,
        registrySource: "hub-sync",
        registryVersion: 5,
        registryUpdatedAt: "2026-04-24T11:59:00.000Z",
      },
      {
        workspaceId: "ws-2",
        workspaceSlug: "workspace-2",
        workspaceName: "Workspace Two",
        updatedAt: "2026-04-21T09:00:00.000Z",
        currentRoleCode: null,
        currentRoleNameZh: null,
        activeChanges: [],
        waitingReviewChanges: [],
        pendingArchiveChanges: [],
        archivedChanges: ["change-c"],
        specAssets: [
          { sourceKind: "openspec", updatedAt: "2026-04-22T12:00:00.000Z" },
        ],
        hasBlockingGate: false,
        registrySource: "local-fallback",
        registryVersion: null,
        registryUpdatedAt: null,
      },
    ] satisfies GovernanceWorkspaceSource[]);

    expect(summary.metrics).toMatchObject({
      activeProjects: 2,
      activeChanges: 1,
      waitingReviewChanges: 1,
      pendingArchiveChanges: 1,
      archivedChanges: 2,
      weeklyNewAssets: 3,
      historyTasks: 1,
    });
    expect(summary.metrics.archiveSuccessRate).toBeCloseTo(0.67, 2);
    expect(summary.workspaceCards[0]).toMatchObject({
      workspaceSlug: "workspace-1",
      currentRoleNameZh: "前端实现专家",
      health: "warning",
      registrySource: "hub-sync",
      registryVersion: 5,
    });
  });
});
