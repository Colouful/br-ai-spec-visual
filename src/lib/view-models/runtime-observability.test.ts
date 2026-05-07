import { describe, expect, it } from "vitest";
import { createCollectorStore, EvidenceReportService, RunEventService } from "@/server/collector";
import {
  buildCollectorRunDetailVm,
  buildCollectorRunsPageVm,
  buildRuntimeQualityRiskVm,
} from "@/lib/view-models/runtime-observability";

function privacy() {
  return {
    sourceCodeIncluded: false,
    rawPromptIncluded: false,
    rawResponseIncluded: false,
    absolutePathIncluded: false,
  };
}

describe("runtime observability view-model", () => {
  it("从 Collector Store 构建 Run 列表和详情时间线", () => {
    const store = createCollectorStore();
    const runEvents = new RunEventService(store);
    runEvents.collect({
      eventId: "evt_1",
      runId: "run_1",
      projectId: "proj_1",
      workspaceId: "ws_1",
      eventType: "run.started",
      stage: "start",
      status: "running",
      severity: "info",
      message: "运行开始",
      timestamp: "2026-05-07T00:00:00.000Z",
      metadata: { agentRole: "planner", inputSummary: "需求摘要" },
      privacy: privacy(),
    });
    runEvents.collect({
      eventId: "evt_2",
      runId: "run_1",
      projectId: "proj_1",
      workspaceId: "ws_1",
      eventType: "review.finished",
      stage: "review",
      status: "success",
      severity: "info",
      message: "评审通过",
      timestamp: "2026-05-07T00:02:00.000Z",
      metadata: { agentRole: "reviewer", outputSummary: "无阻塞项" },
      privacy: privacy(),
    });

    const list = buildCollectorRunsPageVm(store, "Asia/Shanghai", new Date("2026-05-07T00:03:00.000Z"));
    const detail = buildCollectorRunDetailVm(
      store,
      "run_1",
      "Asia/Shanghai",
      new Date("2026-05-07T00:03:00.000Z"),
    );

    expect(list?.active).toHaveLength(1);
    expect(detail?.run.stages.map((stage) => stage.label)).toEqual([
      "run.started",
      "review.finished",
    ]);
    expect(detail?.run.agentCollaboration.items).toHaveLength(2);
  });

  it("统计质量指标并提取风险审计事件", () => {
    const store = createCollectorStore();
    const runEvents = new RunEventService(store);
    const evidence = new EvidenceReportService(store);
    runEvents.collect({
      eventId: "evt_security",
      runId: "run_risk",
      projectId: "proj_1",
      eventType: "policy.denied",
      stage: "privacy",
      status: "blocked",
      severity: "blocking",
      message: "策略拒绝",
      timestamp: "2026-05-07T00:00:00.000Z",
      metadata: { reason: "sensitive-field" },
      privacy: privacy(),
    });
    evidence.collect({
      runId: "run_risk",
      projectId: "proj_1",
      hookResults: [{ hookId: "privacy", status: "blocked", blocking: true }],
      testResults: [{ command: "pnpm test", status: "failure" }],
      repairResults: [{ attempt: 1, status: "failure" }],
      reviewResults: [{ reviewer: "security", status: "blocked" }],
      finalStatus: "blocked",
      privacy: privacy(),
    });

    const vm = buildRuntimeQualityRiskVm(store, { projectId: "proj_1" });

    expect(vm.quality.cards.find((card) => card.label === "阻塞任务数")?.value).toBe("1");
    expect(vm.risk.events).toHaveLength(1);
    expect(vm.risk.events[0].eventType).toBe("policy.denied");
  });
});
