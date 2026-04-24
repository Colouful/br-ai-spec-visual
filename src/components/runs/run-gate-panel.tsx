"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

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

// 点击"同意/拒绝"后的本地防抖时长（毫秒）。
// 原因：审批指令需要经 ControlOutbox → visual watch → inbox-consumer 反写 state.snapshot
// 再由 WS/refresh 回灌到前端，整个闭环在真实环境里约 2~5s。期间 gate.pendingGate 仍是旧值，
// 如果用户连点就会重复下发，造成截图里的 "No pending approval gate found / 冲突" 语义噪音。
const SUBMIT_COOLDOWN_MS = 5000;

export function RunGatePanel({ workspaceId, runKey, gate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const send = useCallback(
    (decision: "approved" | "rejected") => {
      if (cooldown) return;
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setCooldown(true);
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(
        () => setCooldown(false),
        SUBMIT_COOLDOWN_MS,
      );
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
            // 闭环链路：approve → ControlOutbox → visual watch → inbox-consumer
            //   → approveRunState + writeGateSignal(.ai-spec/gate-signal.json)
            //   → IDE 侧 AI（已进入 "visual 门禁等待循环"）每 3s poll 命中 → 自动 /spec-continue
            // 前提：项目根后台已跑 `node bin/cli.js visual watch` 且 IDE 对话在门禁处
            //      按规则 15-visual-gate-wait 进入了等待循环（Cursor rule / Claude skill 已注入）。
            // 超时：AI 侧 60s 未收到信号会按默认策略自动放行继续。
            setFeedback(
              decision === "approved"
                ? "已批准。若项目已跑 `cli.js visual watch` 且 IDE 对话处于门禁等待循环，将在约 3s 内自动继续；60s 未收到信号会按默认策略放行。"
                : "已拒绝。IDE 对话收到 gate-signal.json(decision=rejected) 后会停止推进并在对话里汇报；请按驳回原因修正后重走流程。",
            );
            try {
              router.refresh();
            } catch {
              /* noop */
            }
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            setFeedback(`下发失败：${message}`);
            setCooldown(false);
            if (cooldownTimer.current) {
              clearTimeout(cooldownTimer.current);
              cooldownTimer.current = null;
            }
          });
      });
    },
    [cooldown, gate.pendingGate, router, runKey, workspaceId],
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
        <span
          title={
            cooldown
              ? "刚刚已下发，正在等待后端回灌 state.snapshot（约 5 秒）。"
              : gate.awaitingDecision
                ? undefined
                : "当前 run 后端未处于待审批态（pending_gate 为空），请先回 IDE 在对话框确认，或等待 state.snapshot 进入 before-* gate。"
          }
        >
          <button
            disabled={pending || cooldown || !gate.awaitingDecision}
            onClick={() => send("approved")}
            className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cooldown ? "已下发，等待回灌…" : "同意 → 推进"}
          </button>
        </span>
        <span
          title={
            cooldown
              ? "刚刚已下发，正在等待后端回灌 state.snapshot（约 5 秒）。"
              : gate.awaitingDecision
                ? undefined
                : "当前 run 后端未处于待审批态，无法拒绝。"
          }
        >
          <button
            disabled={pending || cooldown || !gate.awaitingDecision}
            onClick={() => send("rejected")}
            className="rounded-full border border-rose-300/50 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            拒绝
          </button>
        </span>
        {!gate.awaitingDecision && !feedback ? (
          <p className="basis-full text-xs leading-relaxed text-amber-200/80">
            当前 run 后端未处于 Visual 待审批态（pending_gate ={" "}
            <code className="font-mono text-amber-100">
              {gate.pendingGate ? `“${gate.pendingGate}”` : "null"}
            </code>
            ）。如 IDE 对话框要求“用一句话确认”，请回 Cursor / Claude Code
            对话框回复“同意按当前实现继续”；Visual 这里不会发出新的审批指令。
          </p>
        ) : null}
        {feedback ? (
          <p className="basis-full text-xs leading-relaxed text-white/60">
            {feedback}
          </p>
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
