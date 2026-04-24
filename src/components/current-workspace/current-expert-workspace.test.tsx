import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CurrentExpertWorkspace,
  type CurrentExpertWorkspaceViewModel,
} from "@/components/current-workspace/current-expert-workspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

function createViewModel(): CurrentExpertWorkspaceViewModel {
  return {
    workspaceId: "ws-demo",
    workspaceName: "Demo Workspace",
    workspaceSlug: "demo",
    userCanApprove: true,
    registryInfo: {
      source: "hub-sync",
      version: 4,
      lastSyncedAt: "2026-04-24T10:00:00.000Z",
    },
    workspaceAssets: [
      {
        id: "asset-1",
        sourceKind: "openspec",
        sourcePath: "openspec/changes/change-001/proposal.md",
        assetType: "proposal",
        status: "active",
        title: "proposal",
      },
      {
        id: "asset-2",
        sourceKind: "ai-spec-history",
        sourcePath: ".ai-spec/history/run-001/implementation-notes.md",
        assetType: "implementation-notes",
        status: "history",
        title: "implementation-notes",
      },
    ],
    hero: {
      title: "前端实现专家",
      code: "frontend-implementer",
      summary: "PRD 到交付 / 当前任务：完成工作台重构",
      flowName: "PRD 到交付",
      stageLabel: "等待归档门禁",
      runStatusLabel: "等待门禁审批",
      gateStatusLabel: "before-archive",
      taskSummary: "完成工作台首页与审批联动",
      nextRole: {
        code: "code-guardian",
        nameZh: "代码守护专家",
      },
      assetSummary: {
        total: 3,
        openspec: 2,
        history: 1,
        reviewing: 1,
        input: 2,
        output: 0,
        pending: 1,
      },
      actions: {
        primary: [
          { id: "approve", label: "批准通过" },
          { id: "reject", label: "驳回修改" },
        ],
        secondary: [
          { id: "view-pending-assets", label: "查看待审资产" },
          { id: "request-changes", label: "要求补充" },
        ],
      },
    },
    flow: {
      id: "flow-1",
      flowCode: "prd-to-delivery",
      flowName: "PRD 到交付",
      runId: "run-001",
      status: "waiting-approval",
      currentRoleCode: "frontend-implementer",
      nodes: [
        {
          id: "node-1",
          roleCode: "requirement-analyst",
          roleNameZh: "需求解析专家",
          roleNameEn: "requirement-analyst",
          required: true,
          optional: false,
          status: "done",
          taskSummary: "完成需求收敛",
          gate: null,
          inputAssets: [],
          outputAssets: [],
          pendingAssets: [],
          timeline: [],
          queueLog: [],
        },
        {
          id: "node-2",
          roleCode: "frontend-implementer",
          roleNameZh: "前端实现专家",
          roleNameEn: "frontend-implementer",
          required: true,
          optional: false,
          status: "waiting-approval",
          taskSummary: "等待归档审批",
          gate: {
            id: "gate-1",
            gateType: "before-archive",
            status: "waiting-approval",
            mode: "main-flow-blocking",
            resolution: null,
            comment: null,
            reason: "等待审批",
            requiredAssets: [],
          },
          inputAssets: [],
          outputAssets: [],
          pendingAssets: [],
          timeline: [],
          queueLog: [],
        },
      ],
    },
    drawer: {
      defaultNodeId: "node-2",
      defaultTab: "gate-approval",
    },
  };
}

describe("CurrentExpertWorkspace", () => {
  it("在待审批态优先展示审批按钮", () => {
    render(
      <CurrentExpertWorkspace
        viewModel={createViewModel()}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "批准通过" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "驳回修改" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看待审资产" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "继续执行" })).not.toBeInTheDocument();
  });

  it("点击节点后打开右侧抽屉，不跳转页面", () => {
    render(
      <CurrentExpertWorkspace
        viewModel={createViewModel()}
        onAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /前端实现专家/i }));

    expect(screen.getByText("阶段详情")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "门禁审批" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("点击主卡审批动作时先打开完整门禁面板", () => {
    render(<CurrentExpertWorkspace viewModel={createViewModel()} />);

    fireEvent.click(screen.getByRole("button", { name: "批准通过" }));

    expect(screen.getByText("阶段详情")).toBeInTheDocument();
    expect(screen.getByLabelText("审批备注")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认批准通过" })).toBeInTheDocument();
  });

  it("空态下点击查看规范资产也会打开抽屉", () => {
    render(
      <CurrentExpertWorkspace
        viewModel={{
          ...createViewModel(),
          hero: {
            ...createViewModel().hero,
            title: "暂无活跃专家",
            code: "idle",
            summary: "当前工作区暂无运行中的专家流程",
            flowName: "暂无流程",
            stageLabel: "空闲",
            runStatusLabel: "空闲",
            gateStatusLabel: "none",
            taskSummary: "等待新的运行进入工作台。",
            nextRole: null,
            actions: {
              primary: [{ id: "view-assets", label: "查看规范资产" }],
              secondary: [],
            },
          },
          flow: {
            ...createViewModel().flow,
            flowName: "暂无活跃流程",
            currentRoleCode: null,
            nodes: [],
          },
          drawer: {
            defaultNodeId: null,
            defaultTab: "overview",
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "查看规范资产" }));

    expect(screen.getByText("阶段详情")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "规范资产" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getAllByText("openspec/changes/change-001/proposal.md").length,
    ).toBeGreaterThan(0);
  });
});
