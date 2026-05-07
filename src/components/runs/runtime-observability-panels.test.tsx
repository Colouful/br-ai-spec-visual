import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeOverviewPanel } from "@/components/runs/runtime-overview-panel";
import {
  RunAgentCollaborationPanel,
  RunRuntimeResultsPanel,
} from "@/components/runs/runtime-result-panels";

describe("runtime observability panels", () => {
  it("展示 Hook/Test/Repair/Review 结果摘要", () => {
    render(
      <RunRuntimeResultsPanel
        results={{
          changedFiles: [{ id: "file:1", label: "src/app/page.tsx", status: "modify", summary: "更新页面", meta: "", blocking: false }],
          hookResults: [{ id: "hook:1", label: "post-test", status: "blocked", summary: "Hook 阻塞", meta: "", blocking: true }],
          testResults: [{ id: "test:1", label: "pnpm test", status: "failure", summary: "测试失败", meta: "", blocking: true }],
          repairResults: [{ id: "repair:1", label: "attempt-1", status: "success", summary: "已修复", meta: "1", blocking: false }],
          reviewResults: [{ id: "review:1", label: "reviewer", status: "success", summary: "通过", meta: "", blocking: false }],
          finalStatus: "blocked",
          blockerCount: 2,
          maxRepairAttempts: 1,
        }}
      />,
    );

    expect(screen.getByText("Hook / Test / Repair / Review")).toBeInTheDocument();
    expect(screen.getByText("Hook 阻塞")).toBeInTheDocument();
    expect(screen.getByText("测试失败")).toBeInTheDocument();
    expect(screen.getByText("最大修复次数 1")).toBeInTheDocument();
  });

  it("展示 Agent 协作顺序和最终裁决", () => {
    render(
      <RunAgentCollaborationPanel
        collaboration={{
          summary: "共 2 个 Agent 协作节点。",
          items: [
            {
              id: "agent-1",
              role: "planner",
              status: "success",
              order: 1,
              inputSummary: "需求摘要",
              outputSummary: "计划摘要",
            },
            {
              id: "agent-2",
              role: "reviewer",
              status: "blocked",
              order: 2,
              inputSummary: "评审输入",
              outputSummary: "存在争议",
            },
          ],
          conflicts: ["存在争议"],
          humanGates: ["manual-review"],
          finalDecision: "blocked",
        }}
      />,
    );

    expect(screen.getByText("Agent 协作")).toBeInTheDocument();
    expect(screen.getByText("planner")).toBeInTheDocument();
    expect(screen.getByText("manual-review")).toBeInTheDocument();
    expect(screen.getAllByText("blocked").length).toBeGreaterThan(0);
  });

  it("展示质量指标和风险审计摘要", () => {
    render(
      <RuntimeOverviewPanel
        overview={{
          quality: {
            timeRangeLabel: "当前 Collector 内存窗口",
            projectId: "proj_1",
            cards: [
              { label: "任务成功率", value: "50%", note: "1/2" },
              { label: "阻塞任务数", value: "1", note: "finalStatus=blocked" },
            ],
            trend: [{ label: "run_1", value: 1, status: "blocked" }],
          },
          risk: {
            filters: {
              projectId: "proj_1",
              eventTypes: ["policy.denied"],
              severities: ["blocking"],
            },
            events: [
              {
                id: "risk-1",
                runId: "run_1",
                projectId: "proj_1",
                eventType: "policy.denied",
                severity: "blocking",
                stage: "privacy",
                summary: "策略拒绝",
                occurredAt: "2026-05-07T00:00:00.000Z",
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText("质量指标")).toBeInTheDocument();
    expect(screen.getByText("风险与审计")).toBeInTheDocument();
    expect(screen.getByText("policy.denied")).toBeInTheDocument();
  });
});
