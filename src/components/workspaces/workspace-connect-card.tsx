"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panel";

interface TokenState {
  agentId: string;
  connectToken: string;
  expiresAt: string;
  websocketUrl: string;
}

export function WorkspaceConnectCard({
  workspaceId,
  workspaceSlug,
  workspaceName,
  rootPath,
}: {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  rootPath: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);

  const publicBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3000";
    return window.location.origin;
  }, []);

  const bridgeSnippet = useMemo(() => {
    if (!tokenState) return null;
    return JSON.stringify(
      {
        schema_version: 1,
        enabled: true,
        server_url: publicBaseUrl,
        workspace_id: workspaceId,
        agent_id: tokenState.agentId,
        connect_token: tokenState.connectToken,
        push_mode: "hook",
        inbox_transport: "http-pull",
        poll_interval_hint: "on-cli-tick",
      },
      null,
      2,
    );
  }, [publicBaseUrl, tokenState, workspaceId]);

  async function handleGenerateToken() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/workspaces/${encodeURIComponent(workspaceId)}/connect-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            agent_id: `collector_${workspaceSlug}`,
            ttl_seconds: 600,
          }),
        },
      );

      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : `request failed: ${response.status}`,
        );
      }

      setTokenState({
        agentId: String(body.agent_id ?? `collector_${workspaceSlug}`),
        connectToken: String(body.connect_token ?? ""),
        expiresAt: String(body.expires_at ?? ""),
        websocketUrl: String(body.websocket_url ?? ""),
      });
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel title="Visual Bridge 接入" eyebrow="Connect Token">
      <div className="space-y-4">
        <p className="text-sm leading-7 text-slate-300">
          为 <span className="text-slate-100">{workspaceName}</span> 生成一个短时有效的
          `connect token(连接令牌)`，用于把 `visual-bridge.json(可视化桥接配置)` 对齐到当前工作区。
          这一步不会改 `base(规范 CLI 项目)` 主流程，只是给切面桥接补足配置。
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard label="workspace_id" value={workspaceId} />
          <InfoCard label="server_url" value={publicBaseUrl} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateToken}
            disabled={pending}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "生成中…" : "生成 10 分钟 connect token"}
          </button>
          <span className="text-xs text-slate-500">
            适合本地接入、自检和联通测试，不会影响既有运行态文件。
          </span>
        </div>

        {error ? (
          <div className="rounded-[18px] border border-rose-400/16 bg-rose-400/8 px-4 py-3 text-sm leading-6 text-rose-100">
            {error}
          </div>
        ) : null}

        {tokenState ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="agent_id" value={tokenState.agentId} />
              <InfoCard label="expires_at" value={tokenState.expiresAt} />
            </div>

            <div className="rounded-[22px] border border-white/8 bg-black/30 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                visual-bridge.json 片段
              </p>
              <pre className="mt-3 whitespace-pre-wrap break-all text-sm leading-6 text-slate-200">
                {bridgeSnippet}
              </pre>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-black/30 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                推荐命令链路
              </p>
              <pre className="mt-3 whitespace-pre-wrap break-all text-sm leading-6 text-slate-200">
{`ai-spec-auto visual init --server ${publicBaseUrl} --workspace-id ${workspaceId} --agent-id ${tokenState.agentId} --connect-token ${tokenState.connectToken} --yes
ai-spec-auto visual status --target ${rootPath ?? "<project-root>"}
ai-spec-auto visual test --target ${rootPath ?? "<project-root>"}`}
              </pre>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                websocket_url(实时连接地址)：{tokenState.websocketUrl}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-400">
            先生成临时 `connect token(连接令牌)`，再用上面的命令把 `visual-bridge(可视化桥接)` 接到当前工作区。
          </div>
        )}
      </div>
    </Panel>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-all text-sm leading-6 text-white">{value}</p>
    </div>
  );
}
