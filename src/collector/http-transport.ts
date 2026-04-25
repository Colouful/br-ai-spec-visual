import type { RawIngestEventDraft } from "@/lib/contracts/ingest";

export async function sendRawIngestPayload(input: {
  serverUrl: string;
  workspaceId: string;
  agentId: string;
  connectToken?: string; // 改为可选
  sourceKind: string;
  projectRoot?: string;
  hubLock?: unknown;
  rawEvents: RawIngestEventDraft[];
}) {
  const url = new URL("/api/internal/ingest/raw", input.serverUrl);

  // HTTP header 只能稳定承载 Latin-1 范围字符；中文 workspaceId 放在 body 中传输。
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "X-Agent-ID": input.agentId,
  };
  if (/^[\x00-\x7F]*$/.test(input.workspaceId)) {
    headers["X-Workspace-ID"] = input.workspaceId;
  }

  // 如果提供了 connectToken，则使用完整的 body 格式
  const body = input.connectToken
    ? {
        workspace_id: input.workspaceId,
        agent_id: input.agentId,
        connect_token: input.connectToken,
        source_kind: input.sourceKind,
        root_path: input.projectRoot ?? null,
        hub_lock: input.hubLock ?? null,
        raw_events: input.rawEvents,
      }
    : {
        // 简化格式：不需要 connect_token
        sourceKind: input.sourceKind,
        workspaceId: input.workspaceId,
        projectRoot: input.projectRoot ?? null,
        hubLock: input.hubLock ?? null,
        rawEvents: input.rawEvents,
      };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`raw ingest failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  
  return {
    ok: true,
    inserted: result.inserted || result.raw_event_count || input.rawEvents.length,
    skipped: result.skipped || 0,
    total: input.rawEvents.length,
  };
}
