import { describe, expect, it } from "vitest";
import { createCollectorStore, HistoryService } from "@/server/collector";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    historyId: "hist_1",
    runId: "run_1",
    projectId: "proj_1",
    title: "新增用户列表",
    summary: "完成列表页面与测试摘要。",
    changedFiles: [{ path: "src/app/users/page.tsx", action: "created" }],
    assetsUsed: [{ slug: "planner-role", version: "1.0.0" }],
    verificationSummary: { passed: true },
    createdAt: "2026-04-25T10:00:00.000Z",
    privacy: {
      sourceCodeIncluded: false,
      rawPromptIncluded: false,
      rawResponseIncluded: false,
      absolutePathIncluded: false,
    },
    ...overrides,
  };
}

describe("HistoryService", () => {
  it("history 上报成功", () => {
    const service = new HistoryService(createCollectorStore());
    const result = service.collect(payload());

    expect(result.history.historyId).toBe("hist_1");
    expect(result.history.changedFiles).toHaveLength(1);
  });

  it("history changedFiles 只允许相对路径", () => {
    const service = new HistoryService(createCollectorStore());
    expect(() =>
      service.collect(payload({ changedFiles: [{ path: "/Users/demo/app.ts", action: "updated" }] })),
    ).toThrow("敏感字段");
  });

  it("historyId 幂等不重复写入", () => {
    const store = createCollectorStore();
    const service = new HistoryService(store);
    const first = service.collect(payload());
    const second = service.collect(payload({ title: "changed" }));

    expect(second.idempotent).toBe(true);
    expect(second.history.id).toBe(first.history.id);
    expect(store.historyItems.size).toBe(1);
  });
});
