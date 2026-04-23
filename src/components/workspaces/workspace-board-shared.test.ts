import { describe, expect, it } from "vitest";

import type { BoardCardVm } from "@/lib/view-models/board";

import { resolveBoardControlIntent } from "./workspace-board-shared";

function createCard(overrides: Partial<BoardCardVm> = {}): BoardCardVm {
  return {
    id: "run:demo",
    runKey: "run-demo",
    title: "demo",
    subtitle: "demo",
    status: "waiting-approval",
    pendingGate: "before-guardian",
    currentRole: "frontend-implementer",
    changeKey: "demo-change",
    lastEventType: "gate-blocked",
    lastOccurredAt: "1m ago",
    updatedAt: "2026-04-23T10:00:00.000Z",
    artifacts: [],
    laneId: "guardian",
    ...overrides,
  };
}

describe("resolveBoardControlIntent", () => {
  it("uses reject for guardian -> implementation when a gate is pending", () => {
    const intent = resolveBoardControlIntent(
      createCard({ pendingGate: "before-guardian" }),
      "guardian",
      "implementation",
    );

    expect(intent).toEqual({
      kind: "control",
      action: "reject",
      gate: "before-guardian",
    });
  });

  it("refreshes instead of calling approve when guardian card has no pending gate", () => {
    const intent = resolveBoardControlIntent(
      createCard({
        status: "running",
        pendingGate: null,
        lastEventType: "gate-cleared",
      }),
      "guardian",
      "implementation",
    );

    expect(intent.kind).toBe("refresh");
  });

  it("refreshes instead of approving when implementation card is not waiting for guardian review", () => {
    const intent = resolveBoardControlIntent(
      createCard({
        laneId: "implementation",
        status: "running",
        pendingGate: null,
        lastEventType: "gate-cleared",
      }),
      "implementation",
      "guardian",
    );

    expect(intent).toEqual({
      kind: "refresh",
      message: "当前卡片还没有进入守门评审待审批状态，不能直接拖入守门评审。",
    });
  });

  it("refreshes instead of approving when implementation card is not waiting for archive", () => {
    const intent = resolveBoardControlIntent(
      createCard({
        laneId: "implementation",
        status: "running",
        pendingGate: null,
        lastEventType: "run.state_changed",
      }),
      "implementation",
      "archive",
    );

    expect(intent).toEqual({
      kind: "refresh",
      message: "当前卡片还没有进入归档前待审批状态，不能直接拖入归档。",
    });
  });
});
