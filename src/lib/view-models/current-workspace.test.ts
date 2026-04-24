import { describe, expect, it } from "vitest";

import {
  buildCurrentWorkspaceVm,
  deriveHeroActions,
  type CurrentWorkspaceSource,
} from "@/lib/view-models/current-workspace";

function createSource(
  overrides: Partial<CurrentWorkspaceSource> = {},
): CurrentWorkspaceSource {
  return {
    workspace: {
      id: "ws-demo",
      slug: "demo",
      name: "Demo Workspace",
      rootPath: "/tmp/demo",
    },
    activeRun: {
      runId: "run_001",
      status: "waiting-approval",
      lastEventType: "gate.waiting",
      lastOccurredAt: "2026-04-24T10:00:00.000Z",
      payload: {
        current_role: "frontend-implementer",
        pending_gate: "before-archive",
        flow: {
          id: "prd-to-delivery",
          name: "PRD 到交付",
        },
        task: {
          change_id: "change-001",
          summary: "完成工作台首屏重构",
        },
        events: [
          {
            type: "run-created",
            at: "2026-04-24T09:00:00.000Z",
          },
          {
            type: "role-handoff",
            at: "2026-04-24T09:20:00.000Z",
            from_role: "requirement-analyst",
            to_role: "frontend-implementer",
          },
        ],
      },
    },
    flowTemplate: {
      slug: "prd-to-delivery",
      name: "PRD 到交付",
      requiredRoles: [
        "requirement-analyst",
        "frontend-implementer",
        "code-guardian",
      ],
      optionalRoles: ["archive-change"],
    },
    roles: [
      { slug: "requirement-analyst", nameZh: "需求解析专家" },
      { slug: "frontend-implementer", nameZh: "前端实现专家" },
      { slug: "code-guardian", nameZh: "代码守护专家" },
      { slug: "archive-change", nameZh: "归档专家" },
    ],
    gate: {
      id: "gate-001",
      gateType: "before-archive",
      status: "waiting-approval",
      mode: "main-flow-blocking",
      resolution: null,
      comment: null,
      reason: "等待归档审批",
      requiredAssets: [
        {
          id: "asset-2",
          sourceKind: "openspec",
          sourcePath: "openspec/changes/change-001/tasks.md",
          assetType: "tasks",
          status: "reviewing",
        },
      ],
    },
    specAssets: [
      {
        id: "asset-1",
        sourceKind: "openspec",
        sourcePath: "openspec/changes/change-001/proposal.md",
        assetType: "proposal",
        status: "active",
      },
      {
        id: "asset-2",
        sourceKind: "openspec",
        sourcePath: "openspec/changes/change-001/tasks.md",
        assetType: "tasks",
        status: "reviewing",
      },
      {
        id: "asset-3",
        sourceKind: "ai-spec-history",
        sourcePath: ".ai-spec/history/run_001/implementation-notes.md",
        assetType: "implementation-notes",
        status: "history",
      },
    ],
    timeline: [],
    queueLog: [],
    userCanApprove: true,
    registryInfo: {
      source: "hub-sync",
      version: 3,
      lastSyncedAt: "2026-04-24T09:58:00.000Z",
    },
    ...overrides,
  };
}

describe("buildCurrentWorkspaceVm", () => {
  it("从 flow 与 role 注册表派生动态专家流", () => {
    const vm = buildCurrentWorkspaceVm(createSource());

    expect(vm.hero.title).toBe("前端实现专家");
    expect(vm.hero.code).toBe("frontend-implementer");
    expect(vm.flow.nodes.map((node) => node.roleCode)).toEqual([
      "requirement-analyst",
      "frontend-implementer",
      "code-guardian",
      "archive-change",
    ]);
    expect(vm.flow.nodes.map((node) => node.status)).toEqual([
      "done",
      "waiting-approval",
      "pending",
      "skipped",
    ]);
    expect(vm.drawer.defaultTab).toBe("gate-approval");
    expect(vm.hero.assetSummary).toEqual({
      total: 3,
      openspec: 2,
      history: 1,
      reviewing: 1,
      input: 2,
      output: 1,
      pending: 1,
    });
    expect(vm.hero.flowName).toBe("PRD 到交付");
    expect(vm.hero.nextRole).toEqual({
      code: "code-guardian",
      nameZh: "代码守护专家",
    });
    expect(vm.registryInfo).toEqual({
      source: "hub-sync",
      version: 3,
      lastSyncedAt: "2026-04-24T09:58:00.000Z",
    });
  });

  it("在阻塞或失败态时切到 queue-log 默认抽屉", () => {
    const vm = buildCurrentWorkspaceVm(
      createSource({
        activeRun: {
          ...createSource().activeRun!,
          status: "failed",
        },
        gate: {
          ...createSource().gate!,
          status: "rejected",
        },
      }),
    );

    expect(vm.drawer.defaultTab).toBe("queue-log");
  });
});

describe("deriveHeroActions", () => {
  it("在 waiting-approval 时优先展示审批动作", () => {
    const actions = deriveHeroActions({
      runStatus: "waiting-approval",
      gateStatus: "waiting-approval",
      userCanApprove: true,
    });

    expect(actions.primary.map((item) => item.id)).toEqual([
      "approve",
      "reject",
    ]);
    expect(actions.secondary.map((item) => item.id)).toEqual([
      "view-pending-assets",
      "request-changes",
    ]);
  });
});
