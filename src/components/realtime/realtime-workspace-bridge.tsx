"use client";

import { Activity, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { buildBrowserHandshake, toWebSocketUrl } from "@/lib/realtime/browser";

function dedupeWorkspaceIds(workspaceIds: string[]) {
  return [...new Set(workspaceIds.filter(Boolean))];
}

export function RealtimeWorkspaceBridge(props: {
  workspaceIds: string[];
  label?: string;
  onEvent?: (payload: unknown) => void | Promise<void>;
}) {
  const { refresh } = useRouter();
  const { workspaceIds: rawWorkspaceIds, label, onEvent } = props;
  const socketsRef = useRef<WebSocket[]>([]);
  const refreshTimer = useRef<number | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const workspaceIds = useMemo(() => dedupeWorkspaceIds(rawWorkspaceIds), [rawWorkspaceIds]);
  const workspaceIdsKey = workspaceIds.join("\u0000");

  useEffect(() => {
    let cancelled = false;
    socketsRef.current.forEach((socket) => socket.close());
    socketsRef.current = [];
    setConnectedCount(0);
    setErrorCount(0);

    const scheduleRefresh = (payload: unknown) => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = window.setTimeout(() => {
        if (onEvent) {
          void onEvent(payload);
          return;
        }
        startTransition(() => {
          refresh();
        });
      }, 250);
    };

    async function connectWorkspace(workspaceId: string) {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/connect-token`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            agent_id: `browser-${workspaceId}`,
            ttl_seconds: 300,
            capabilities: ["subscribe:events"],
          }),
        });
        if (!response.ok || cancelled) {
          setErrorCount((count) => count + 1);
          return;
        }

        const payload = await response.json();
        const socket = new WebSocket(toWebSocketUrl(payload.websocket_url));
        socketsRef.current.push(socket);

        socket.addEventListener("open", () => {
          socket.send(
            JSON.stringify(
              buildBrowserHandshake({
                workspaceId,
                agentId: payload.agent_id,
                connectToken: payload.connect_token,
                capabilities: payload.capabilities,
              }),
            ),
          );
        });

        socket.addEventListener("message", (event) => {
          const parsed = JSON.parse(event.data);
          if (parsed?.event_type === "session.ack") {
            setConnectedCount((count) => count + 1);
            return;
          }
          if (parsed?.event_type === "session.error") {
            setErrorCount((count) => count + 1);
            return;
          }
          scheduleRefresh(parsed);
        });

        socket.addEventListener("error", () => {
          setErrorCount((count) => count + 1);
        });

        socket.addEventListener("close", () => {
          setConnectedCount((count) => Math.max(0, count - 1));
        });
      } catch (_error) {
        if (!cancelled) {
          setErrorCount((count) => count + 1);
        }
      }
    }

    workspaceIds.forEach((workspaceId) => {
      void connectWorkspace(workspaceId);
    });

    return () => {
      cancelled = true;
      socketsRef.current.forEach((socket) => socket.close());
      socketsRef.current = [];
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
    };
  }, [onEvent, refresh, workspaceIdsKey]);

  const online = connectedCount > 0;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs text-slate-100 backdrop-blur">
      {online ? <Wifi className="h-4 w-4 text-lime-300" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
      <span className="font-mono uppercase tracking-[0.22em]">
        {label || "实时订阅"}
      </span>
      <span className="rounded-full bg-black/20 px-2 py-0.5">
        {connectedCount}/{workspaceIds.length || 0}
      </span>
      {errorCount > 0 ? (
        <span className="inline-flex items-center gap-1 text-amber-200">
          <Activity className="h-3.5 w-3.5" />
          退化
        </span>
      ) : null}
    </div>
  );
}
