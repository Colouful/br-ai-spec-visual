"use client";

import { useCallback, useState, useTransition } from "react";

import type { RunGateInfo } from "@/lib/view-models/runs";

interface Props {
  workspaceId: string;
  runKey: string;
  gate: RunGateInfo;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  delivered: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  applied: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  conflict: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  rejected: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  expired: "border-white/15 bg-white/5 text-white/60",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "待下发",
  delivered: "已下发",
  applied: "已生效",
  conflict: "冲突",
  rejected: "已拒绝",
  expired: "已过期",
};

export function RunGatePanel({ workspaceId, runKey, gate }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const send = useCallback(
    (decision: "approved" | "rejected") => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      startTransition(() => {
        fetch("/api/control/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id: requestId,
            workspace_id: workspaceId,
            run_id: runKey,
            actor_id: "rundetail-ui",
            decision,
            gate: gate.pendingGate || "before-implementation",
          }),
          credentials: "include",
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(await response.text());
            }
            setFeedback(
              `已下发 ${decision === "approved" ? "同意" : "拒绝"}`,
            );
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            setFeedback(`下发失败：${message}`);
          });
      });
    },
    [gate.pendingGate, runKey, workspaceId],
  );

  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(8,15,25,0.96),rgba(13,21,34,0.88))] p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            审批面板
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            守门员 / 审批通道
          </h3>
        </div>
        {gate.awaitingDecision ? (
          <span className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/15 px-3 py-1 text-[11px] text-fuchsia-100">
            等待人工决策
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
            无待审
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
            待审节点
          </p>
          <p className="mt-1 text-white">{gate.pendingGate || "—"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
            当前角色
          </p>
          <p className="mt-1 text-white">{gate.currentRole || "—"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={pending || !gate.awaitingDecision}
          onClick={() => send("approved")}
          className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          同意 → 推进
        </button>
        <button
          disabled={pending || !gate.awaitingDecision}
          onClick={() => send("rejected")}
          className="rounded-full border border-rose-300/50 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          拒绝
        </button>
        {feedback ? (
          <span className="text-xs text-white/60">{feedback}</span>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
          指令发件箱（最近 10 条）
        </p>
        <div className="mt-2 space-y-2">
          {gate.outbox.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-xs text-white/40">
              尚无控制指令记录
            </p>
          ) : (
            gate.outbox.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white">{row.command}</p>
                  <p className="font-mono text-[10px] text-white/40">
                    {new Date(row.createdAt).toLocaleString("zh-CN")}
                  </p>
                  {row.reason ? (
                    <p className="mt-0.5 truncate text-[11px] text-white/50">
                      {row.reason}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
                    STATUS_STYLE[row.status] || STATUS_STYLE.pending
                  }`}
                >
                  {STATUS_LABEL[row.status] || row.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
