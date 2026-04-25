import { beforeEach, describe, expect, it } from "vitest";
import { POST as historyPOST } from "@/app/api/collector/history/route";
import { POST as incidentPOST } from "@/app/api/collector/incident/route";
import { POST as projectStatePOST } from "@/app/api/collector/project-state/route";
import { POST as runEventPOST } from "@/app/api/collector/run-event/route";
import { resetDefaultCollectorStore } from "@/server/collector";

function postJson(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readBody(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function expectApiResponse(body: Record<string, unknown>, success: boolean) {
  expect(body.success).toBe(success);
  expect(body.requestId).toBeTruthy();
  expect(body.timestamp).toBeTruthy();
  if (success) {
    expect(body.data).toBeTruthy();
    expect(body.error).toBeNull();
  } else {
    expect(body.data).toBeNull();
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBeTruthy();
    expect(error.message).toBeTruthy();
    expect(error.suggestion).toBeTruthy();
  }
}

function privacy() {
  return {
    sourceCodeIncluded: false,
    rawPromptIncluded: false,
    rawResponseIncluded: false,
    absolutePathIncluded: false,
  };
}

describe("Collector API", () => {
  beforeEach(() => {
    resetDefaultCollectorStore();
  });

  it("project-state 上报成功并返回统一 ApiResponse", async () => {
    const response = await projectStatePOST(
      postJson("http://localhost/api/collector/project-state", {
        eventId: "evt_project_1",
        projectId: "proj_1",
        workspaceId: "ws_1",
        projectHash: "sha256:project",
        name: "demo",
        type: "single",
        techProfile: { domain: "frontend", language: ["typescript"] },
        manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
        packages: [{ packageId: "root", path: "." }],
        privacy: privacy(),
        reportedAt: "2026-04-25T10:00:00.000Z",
      }),
    );
    const body = await readBody(response);
    const data = body.data as { project: { projectId: string } };

    expectApiResponse(body, true);
    expect(data.project.projectId).toBe("proj_1");
  });

  it("project-state 重复 eventId 幂等", async () => {
    const payload = {
      eventId: "evt_project_same",
      projectId: "proj_1",
      type: "single",
      techProfile: {},
      manifest: {},
      privacy: privacy(),
      reportedAt: "2026-04-25T10:00:00.000Z",
    };
    await projectStatePOST(postJson("http://localhost/api/collector/project-state", payload));
    const response = await projectStatePOST(postJson("http://localhost/api/collector/project-state", payload));
    const body = await readBody(response);
    const data = body.data as { idempotent: boolean };

    expectApiResponse(body, true);
    expect(data.idempotent).toBe(true);
  });

  it("run-event type=spec_started 创建 run", async () => {
    const response = await runEventPOST(
      postJson("http://localhost/api/collector/run-event", {
        eventId: "evt_run_1",
        runId: "run_1",
        projectId: "proj_1",
        type: "spec_started",
        state: "planning",
        stage: "planning",
        level: "info",
        payload: {},
        occurredAt: "2026-04-25T10:00:00.000Z",
        privacy: privacy(),
      }),
    );
    const body = await readBody(response);
    const data = body.data as { run: { runId: string; startedAt: string } };

    expectApiResponse(body, true);
    expect(data.run.runId).toBe("run_1");
    expect(data.run.startedAt).toBe("2026-04-25T10:00:00.000Z");
  });

  it("run-event type=run_completed 更新 completedAt", async () => {
    await runEventPOST(
      postJson("http://localhost/api/collector/run-event", {
        eventId: "evt_run_1",
        runId: "run_1",
        projectId: "proj_1",
        type: "spec_started",
        level: "info",
        payload: {},
        occurredAt: "2026-04-25T10:00:00.000Z",
        privacy: privacy(),
      }),
    );
    const response = await runEventPOST(
      postJson("http://localhost/api/collector/run-event", {
        eventId: "evt_run_2",
        runId: "run_1",
        projectId: "proj_1",
        type: "run_completed",
        state: "completed",
        level: "info",
        payload: {},
        occurredAt: "2026-04-25T10:03:00.000Z",
        privacy: privacy(),
      }),
    );
    const body = await readBody(response);
    const data = body.data as { run: { completedAt: string } };

    expectApiResponse(body, true);
    expect(data.run.completedAt).toBe("2026-04-25T10:03:00.000Z");
  });

  it("history 上报成功", async () => {
    const response = await historyPOST(
      postJson("http://localhost/api/collector/history", {
        historyId: "hist_1",
        runId: "run_1",
        projectId: "proj_1",
        title: "新增用户列表",
        summary: "完成结构化摘要。",
        changedFiles: [{ path: "src/app/users/page.tsx", action: "created" }],
        assetsUsed: [],
        verificationSummary: { passed: true },
        createdAt: "2026-04-25T10:00:00.000Z",
        privacy: privacy(),
      }),
    );
    const body = await readBody(response);
    const data = body.data as { history: { historyId: string } };

    expectApiResponse(body, true);
    expect(data.history.historyId).toBe("hist_1");
  });

  it("incident 上报成功并保存 fatal level", async () => {
    const response = await incidentPOST(
      postJson("http://localhost/api/collector/incident", {
        incidentId: "inc_1",
        runId: "run_1",
        projectId: "proj_1",
        type: "context-build-failed",
        level: "fatal",
        message: "上下文构建失败。",
        suggestion: "请检查缓存资产。",
        diagnoseResult: {},
        recoveryAction: {},
        status: "open",
        createdAt: "2026-04-25T10:00:00.000Z",
        privacy: privacy(),
      }),
    );
    const body = await readBody(response);
    const data = body.data as { incident: { level: string } };

    expectApiResponse(body, true);
    expect(data.incident.level).toBe("fatal");
  });

  it("隐私违规 payload 被拒绝", async () => {
    const response = await runEventPOST(
      postJson("http://localhost/api/collector/run-event", {
        eventId: "evt_bad",
        runId: "run_1",
        projectId: "proj_1",
        type: "executor_completed",
        level: "error",
        payload: { rawPrompt: "完整提示词" },
        occurredAt: "2026-04-25T10:00:00.000Z",
        privacy: privacy(),
      }),
    );
    const body = await readBody(response);

    expect(response.status).toBe(400);
    expectApiResponse(body, false);
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe("PRIVACY_POLICY_VIOLATED");
  });
});
