import type { BoardCardVm, BoardLaneId } from "@/lib/view-models/board";

export type BoardControlIntent =
  | {
      kind: "control";
      action: "approve" | "reject" | "resume" | "cancel";
      gate?: string;
    }
  | {
      kind: "refresh";
      message: string;
    };

function isApprovalReady(card: BoardCardVm) {
  const status = String(card.status || "").toLowerCase();
  return Boolean(card.pendingGate) && (status === "waiting-approval" || status === "paused");
}

export function resolveBoardControlIntent(
  card: BoardCardVm,
  fromLane: BoardLaneId,
  toLane: BoardLaneId,
): BoardControlIntent {
  if (toLane === "implementation" && fromLane === "guardian") {
    if (!card.pendingGate) {
      return {
        kind: "refresh",
        message: "当前卡片没有待处理门禁，已刷新看板状态。",
      };
    }
    return {
      kind: "control",
      action: "reject",
      gate: card.pendingGate,
    };
  }

  if (toLane === "implementation" && fromLane === "proposal") {
    if (!isApprovalReady(card)) {
      return {
        kind: "refresh",
        message: "当前卡片还没有进入实现前待审批门禁，已刷新看板状态。",
      };
    }
    return {
      kind: "control",
      action: "approve",
      gate: card.pendingGate || "before-implementation",
    };
  }

  if (toLane === "guardian") {
    if (!isApprovalReady(card)) {
      return {
        kind: "refresh",
        message: "当前卡片还没有进入守门评审待审批状态，不能直接拖入守门评审。",
      };
    }
    return {
      kind: "control",
      action: "approve",
      gate: card.pendingGate || "before-guardian",
    };
  }

  if (toLane === "archive") {
    if (!isApprovalReady(card)) {
      return {
        kind: "refresh",
        message: "当前卡片还没有进入归档前待审批状态，不能直接拖入归档。",
      };
    }
    return {
      kind: "control",
      action: "approve",
      gate: card.pendingGate || "before-archive",
    };
  }

  if (toLane === "proposal") {
    return {
      kind: "control",
      action: "resume",
    };
  }

  return {
    kind: "refresh",
    message: "当前拖拽没有可执行的控制动作，已刷新看板状态。",
  };
}
