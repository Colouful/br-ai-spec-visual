"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import type {
  BoardCardVm,
  BoardLaneId,
  BoardLaneVm,
  WorkspaceBoardVm,
} from "@/lib/view-models/board";

import { resolveBoardControlIntent } from "./workspace-board-shared";

/**
 * 乐观拖拽 overlay：仅记录"这张卡被临时挪到哪条 lane"。
 * 真正的 lane 数据来自 props（由父级 RSC 在 router.refresh 后重新拉取），
 * 从而让 WebSocket 驱动的 ingest.projected → router.refresh → 新 board
 * 能真正反映到 UI 上。失败时把这条 overlay 删掉即回滚。
 */
type DragOverlay = Record<string, BoardLaneId>;
type PendingCommandState = Record<
  string,
  {
    status: string;
    targetLane: BoardLaneId;
  }
>;

type ToastVariant = "success" | "error" | "info";

interface ToastState {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface BoardProps {
  workspaceId: string;
  board: WorkspaceBoardVm;
}

const LANE_ORDER: BoardLaneId[] = [
  "backlog",
  "proposal",
  "implementation",
  "guardian",
  "archive",
];

const LANE_TRANSITIONS: Record<BoardLaneId, BoardLaneId[]> = {
  backlog: ["proposal"],
  proposal: ["implementation", "guardian"],
  implementation: ["guardian", "archive"],
  guardian: ["implementation", "archive"],
  archive: [],
};

export function WorkspaceBoard({ workspaceId, board }: BoardProps) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<DragOverlay>({});
  const [pendingCommandState, setPendingCommandState] =
    useState<PendingCommandState>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [hoverLaneId, setHoverLaneId] = useState<BoardLaneId | null>(null);

  // 派生 lanes：始终以 props 为真相，overlay 仅做拖拽态 UI 迁移，
  // 这样 router.refresh() 后父 RSC 带回的新 board 会立刻反映到列表里。
  const lanes = useMemo<BoardLaneVm[]>(() => {
    if (Object.keys(overlay).length === 0) return board.lanes;
    const movedCards = new Map<string, BoardCardVm>();
    for (const lane of board.lanes) {
      for (const card of lane.cards) {
        if (overlay[card.id] && overlay[card.id] !== lane.id) {
          movedCards.set(card.id, card);
        }
      }
    }
    if (movedCards.size === 0) return board.lanes;
    return board.lanes.map((lane) => {
      const filtered = lane.cards.filter(
        (card) => !(overlay[card.id] && overlay[card.id] !== lane.id),
      );
      const incoming: BoardCardVm[] = [];
      for (const [cardId, target] of Object.entries(overlay)) {
        if (target !== lane.id) continue;
        const card = movedCards.get(cardId);
        if (card) incoming.push({ ...card, laneId: lane.id });
      }
      if (incoming.length === 0 && filtered.length === lane.cards.length) {
        return lane;
      }
      return { ...lane, cards: [...incoming, ...filtered] };
    });
  }, [board.lanes, overlay]);

  const laneById = useMemo(() => {
    const map = new Map<BoardLaneId, BoardLaneVm>();
    for (const lane of lanes) map.set(lane.id, lane);
    return map;
  }, [lanes]);

  useEffect(() => {
    if (Object.keys(overlay).length === 0) return;

    const actualLaneByCard = new Map<string, BoardLaneId>();
    for (const lane of board.lanes) {
      for (const card of lane.cards) {
        actualLaneByCard.set(card.id, lane.id);
      }
    }

    setOverlay((current) => {
      let changed = false;
      const next = { ...current };
      const nextPending = { ...pendingCommandState };
      for (const [cardId, targetLane] of Object.entries(current)) {
        const actualLane = actualLaneByCard.get(cardId);
        if (!actualLane || actualLane === targetLane) {
          delete next[cardId];
          delete nextPending[cardId];
          changed = true;
        }
      }
      if (changed) {
        setPendingCommandState(nextPending);
      }
      return changed ? next : current;
    });
  }, [board.lanes, overlay, pendingCommandState]);

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    setToast({ id: `${Date.now()}`, variant, message });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const applyOverlay = useCallback(
    (cardId: string, toLane: BoardLaneId) => {
      setOverlay((prev) => ({ ...prev, [cardId]: toLane }));
    },
    [],
  );

  const clearOverlay = useCallback((cardId: string) => {
    setOverlay((prev) => {
      if (!(cardId in prev)) return prev;
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
    setPendingCommandState((prev) => {
      if (!(cardId in prev)) return prev;
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  }, []);

  const sendControlCommand = useCallback(
    async (
      card: BoardCardVm,
      action: "approve" | "reject" | "resume" | "cancel",
      gateOverride?: string,
    ) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const url =
        action === "resume"
          ? "/api/control/resume"
          : "/api/control/approve";
      const body: Record<string, unknown> = {
        request_id: requestId,
        workspace_id: workspaceId,
        run_id: card.runKey,
        actor_id: "kanban-ui",
      };

      if (action === "resume") {
        body.checkpoint_id = card.runKey;
        body.reason = "resume from kanban board";
      } else {
        body.decision =
          action === "reject" ? "rejected" : "approved";
        body.gate = gateOverride || card.pendingGate || "before-implementation";
        if (action === "reject") body.comment = "rejected from kanban board";
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `request failed: ${response.status}`);
      }
      return response.json() as Promise<{ outbox?: { status?: string } }>;
    },
    [workspaceId],
  );

  const handleDrop = useCallback(
    (cardId: string, fromLane: BoardLaneId, toLane: BoardLaneId) => {
      if (fromLane === toLane) return;
      const allowed = LANE_TRANSITIONS[fromLane] || [];
      if (!allowed.includes(toLane)) {
        const fromTitle = laneById.get(fromLane)?.title ?? fromLane;
        const toTitle = laneById.get(toLane)?.title ?? toLane;
        showToast(
          "info",
          `不允许从「${fromTitle}」拖到「${toTitle}」（请先经过中间阶段）`,
        );
        return;
      }
      const card = laneById.get(fromLane)?.cards.find((c) => c.id === cardId);
      if (!card) return;

      applyOverlay(cardId, toLane);

      const intent = resolveBoardControlIntent(card, fromLane, toLane);
      if (intent.kind === "refresh") {
        showToast("info", intent.message);
        clearOverlay(cardId);
        try {
          router.refresh();
        } catch {
          /* noop */
        }
        return;
      }

      startTransition(() => {
        sendControlCommand(card, intent.action, intent.gate)
          .then((result) => {
            const toTitle = laneById.get(toLane)?.title ?? toLane;
            setPendingCommandState((current) => ({
              ...current,
              [card.id]: {
                status: result?.outbox?.status || "pending",
                targetLane: toLane,
              },
            }));
            showToast("success", `已下发：${card.runKey} → ${toTitle}，等待 auto 应用`);
            // 显式兜底刷新：不依赖 WS 事件也能把 outbox 落盘结果拉回 UI。
            // overlay 只在服务端真值切到目标列后才清除，避免命令已入 outbox 但
            // runState 尚未更新时被定时器硬清掉，造成“拖过去又弹回”的假回滚。
            try {
              router.refresh();
            } catch {
              /* noop */
            }
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            showToast("error", `下发失败：${message}`);
            clearOverlay(cardId);
          });
      });
    },
    [
      applyOverlay,
      clearOverlay,
      laneById,
      router,
      sendControlCommand,
      showToast,
      startTransition,
    ],
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-5">
      <details className="group shrink-0 rounded-2xl border border-white/10 bg-white/[0.02] open:border-cyan-300/20 open:bg-white/[0.04]">
        <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 px-4 py-3 text-left text-xs text-slate-300 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 break-words rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono uppercase tracking-[0.22em] text-slate-200">
            拖拽 = 通过(approve) / 驳回(reject) 控制指令
          </span>
          <span className="text-slate-500">展开说明</span>
          {pending ? (
            <span className="ml-auto text-cyan-300">下发中…</span>
          ) : null}
        </summary>
        <p className="border-t border-white/5 px-4 py-3 text-xs leading-relaxed text-slate-400">
          指令通过 visual(可视化端) 的 control_outbox(指令发件箱) 写入，由 auto(自动执行端) 在
          cli(命令行) 边界拉取并签名应用
        </p>
      </details>
      <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex h-full min-h-[12rem] w-max min-w-0 items-stretch gap-5 pr-1">
        {LANE_ORDER.map((laneId) => {
          const lane = laneById.get(laneId);
          if (!lane) return null;
          const isHover = hoverLaneId === laneId;
          return (
            <div
              key={laneId}
              onDragOver={(event) => {
                event.preventDefault();
                setHoverLaneId(laneId);
              }}
              onDragLeave={() => {
                setHoverLaneId((current) => (current === laneId ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                setHoverLaneId(null);
                const cardId = event.dataTransfer.getData("text/card-id");
                const fromLane = event.dataTransfer.getData(
                  "text/lane-id",
                ) as BoardLaneId;
                if (!cardId || !fromLane) return;
                handleDrop(cardId, fromLane, laneId);
              }}
              className={`flex h-full min-h-0 w-[min(20rem,85vw)] min-w-70 max-w-88 shrink-0 flex-col rounded-[28px] border border-white/8 bg-gradient-to-b ${lane.accent} p-5 transition ${
                isHover ? "ring-2 ring-cyan-300/60" : ""
              }`}
            >
              <header className="mb-3 shrink-0 flex items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/70">
                    {lane.title}
                  </p>
                  <p className="mt-1 text-xs text-white/60">{lane.description}</p>
                </div>
                <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 font-mono text-[11px] text-white/80">
                  {lane.cards.length}
                </span>
              </header>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
                {lane.cards.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center text-xs text-white/40">
                    暂无卡片
                  </p>
                ) : (
                  lane.cards.map((card) => {
                    const pendingState = pendingCommandState[card.id];
                    return (
                    <article
                      key={card.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/card-id", card.id);
                        event.dataTransfer.setData("text/lane-id", lane.id);
                        setDragCardId(card.id);
                      }}
                      onDragEnd={() => setDragCardId(null)}
                      className={`group cursor-grab rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur transition hover:border-cyan-300/40 hover:bg-black/40 ${
                        dragCardId === card.id ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/runs/${encodeURIComponent(card.runKey)}`}
                          className="text-sm font-medium text-white hover:text-cyan-300"
                        >
                          {card.title}
                        </Link>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60">
                          {card.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-white/50">
                        {card.lastEventType} · {card.lastOccurredAt}
                      </p>
                      {card.pendingGate ? (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] text-fuchsia-200">
                          关卡(gate) · {card.pendingGate}
                        </p>
                      ) : null}
                      {pendingState ? (
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">
                          待 auto 应用 · outbox {pendingState.status}
                        </p>
                      ) : null}
                      {card.currentRole ? (
                        <p className="mt-1 text-[11px] text-white/50">
                          角色(role)：<span className="text-white/80">{card.currentRole}</span>
                        </p>
                      ) : null}
                      {card.artifacts.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {card.artifacts.map((artifact) => (
                            <span
                              key={artifact.slug}
                              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                            >
                              {artifact.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-sm shadow-2xl ${
            toast.variant === "success"
              ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-100"
              : toast.variant === "error"
                ? "border-rose-300/40 bg-rose-500/20 text-rose-100"
                : "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
