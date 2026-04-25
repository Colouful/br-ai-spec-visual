import { describe, expect, it } from "vitest";
import { createCollectorStore, IncidentService } from "@/server/collector";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    incidentId: "inc_1",
    runId: "run_1",
    projectId: "proj_1",
    type: "token-budget-exceeded",
    level: "fatal",
    stage: "implementation",
    message: "Token 预算超限。",
    suggestion: "请缩小上下文范围后重试。",
    diagnoseResult: { code: "TOKEN_LIMIT" },
    recoveryAction: { action: "manual-review" },
    status: "open",
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

describe("IncidentService", () => {
  it("incident 上报成功", () => {
    const service = new IncidentService(createCollectorStore());
    const result = service.collect(payload());

    expect(result.incident.incidentId).toBe("inc_1");
    expect(result.incident.type).toBe("token-budget-exceeded");
  });

  it("incident fatal level 保存成功", () => {
    const service = new IncidentService(createCollectorStore());
    const result = service.collect(payload());

    expect(result.incident.level).toBe("fatal");
  });

  it("incidentId 幂等不重复写入", () => {
    const store = createCollectorStore();
    const service = new IncidentService(store);
    const first = service.collect(payload());
    const second = service.collect(payload({ level: "warning" }));

    expect(second.idempotent).toBe(true);
    expect(second.incident.id).toBe(first.incident.id);
    expect(store.incidents.size).toBe(1);
  });
});
