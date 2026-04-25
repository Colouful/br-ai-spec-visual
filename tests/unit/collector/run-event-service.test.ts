import { describe, expect, it } from "vitest";
import { createCollectorStore, RunEventService } from "@/server/collector";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "evt_run_1",
    runId: "run_1",
    projectId: "proj_1",
    workspaceId: "ws_1",
    type: "spec_started",
    state: "planning",
    stage: "planning",
    level: "info",
    executor: "codex",
    manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
    payload: { durationMs: 1 },
    occurredAt: "2026-04-25T10:00:00.000Z",
    privacy: {
      sourceCodeIncluded: false,
      rawPromptIncluded: false,
      rawResponseIncluded: false,
      absolutePathIncluded: false,
    },
    ...overrides,
  };
}

describe("RunEventService", () => {
  it("run-event 上报成功并创建 runtime event", () => {
    const service = new RunEventService(createCollectorStore());
    const result = service.collect(payload());

    expect(result.event.eventId).toBe("evt_run_1");
    expect(result.run?.runId).toBe("run_1");
  });

  it("type=spec_started 创建 run", () => {
    const service = new RunEventService(createCollectorStore());
    const result = service.collect(payload());

    expect(result.run?.startedAt).toBe("2026-04-25T10:00:00.000Z");
    expect(result.run?.state).toBe("planning");
  });

  it("type=run_completed 更新 completedAt", () => {
    const store = createCollectorStore();
    const service = new RunEventService(store);
    service.collect(payload());
    const result = service.collect(payload({
      eventId: "evt_run_2",
      type: "run_completed",
      state: "completed",
      occurredAt: "2026-04-25T10:02:00.000Z",
    }));

    expect(result.run?.completedAt).toBe("2026-04-25T10:02:00.000Z");
    expect(result.run?.state).toBe("completed");
  });

  it("eventId 幂等不重复写入", () => {
    const store = createCollectorStore();
    const service = new RunEventService(store);
    service.collect(payload());
    const second = service.collect(payload({ state: "completed" }));

    expect(second.idempotent).toBe(true);
    expect(store.runEvents.size).toBe(1);
  });
});
