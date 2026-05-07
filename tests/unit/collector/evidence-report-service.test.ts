import { describe, expect, it } from "vitest";
import { createCollectorStore, EvidenceReportService } from "@/server/collector";

function report(overrides: Record<string, unknown> = {}) {
  return {
    runId: "run_1",
    projectId: "proj_1",
    taskId: "task_1",
    specId: "spec_1",
    changedFiles: [
      {
        path: "src/app/page.tsx",
        changeType: "modify",
        summary: "更新运行态展示摘要",
      },
    ],
    testResults: [{ command: "pnpm test", status: "success", durationMs: 1200 }],
    hookResults: [{ hookId: "post-test", status: "success", blocking: false }],
    repairResults: [{ attempt: 1, status: "success", summary: "修复测试失败" }],
    reviewResults: [{ reviewer: "reviewer", status: "success", summary: "通过" }],
    finalStatus: "success",
    privacy: {
      sourceCodeIncluded: false,
      rawPromptIncluded: false,
      rawResponseIncluded: false,
      absolutePathIncluded: false,
    },
    ...overrides,
  };
}

describe("EvidenceReportService", () => {
  it("接收 EvidenceReport 并保存 Hook/Test/Repair/Review 摘要", () => {
    const store = createCollectorStore();
    const result = new EvidenceReportService(store).collect(report());

    expect(result.evidence.runId).toBe("run_1");
    expect(result.evidence.finalStatus).toBe("success");
    expect(result.evidence.hookResults).toHaveLength(1);
    expect(result.run?.state).toBe("success");
    expect(store.evidenceReports.get("run_1")?.testResults).toHaveLength(1);
  });

  it("按 runId 幂等更新 EvidenceReport", () => {
    const store = createCollectorStore();
    const service = new EvidenceReportService(store);
    service.collect(report());
    const second = service.collect(report({ finalStatus: "blocked" }));

    expect(second.idempotent).toBe(false);
    expect(store.evidenceReports.size).toBe(1);
    expect(store.evidenceReports.get("run_1")?.finalStatus).toBe("blocked");
  });

  it("拒绝 changedFiles 中的绝对路径", () => {
    const service = new EvidenceReportService(createCollectorStore());

    expect(() =>
      service.collect(
        report({
          changedFiles: [{ path: "/Users/demo/project/src/app/page.tsx" }],
        }),
      ),
    ).toThrow("上报数据包含不允许采集的敏感字段。");
  });
});
