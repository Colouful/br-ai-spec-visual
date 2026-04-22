import { NextResponse } from "next/server";

import { validateConnectToken } from "@/server/connect-token";
import { publishIngestProjectionEvent } from "@/server/ws-server";
import { ingestWorkspaceRawEvents } from "@/lib/services/ingest";

export const runtime = "nodejs";

/**
 * 兼容两种入参形态：
 *   1. Collector 形态：{ workspace_id, agent_id, connect_token, raw_events: [...] }
 *   2. Hook/Receipt 形态（auto 侧 push-client / receipt-pusher）：
 *      headers: X-Workspace-ID, X-Connect-Token
 *      body:    { sourceKind, workspaceId, rawEvents: [...] }
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const headerWorkspaceId = request.headers.get("x-workspace-id");
  const headerToken = request.headers.get("x-connect-token");

  const workspaceId =
    (typeof body.workspace_id === "string" && body.workspace_id) ||
    (typeof body.workspaceId === "string" && body.workspaceId) ||
    headerWorkspaceId ||
    "";

  const connectToken =
    (typeof body.connect_token === "string" && body.connect_token) ||
    (typeof body.connectToken === "string" && body.connectToken) ||
    headerToken ||
    "";

  const agentId =
    (typeof body.agent_id === "string" && body.agent_id) ||
    (typeof body.agentId === "string" && body.agentId) ||
    "ai-spec-auto";

  if (!workspaceId) {
    return NextResponse.json({ error: "missing workspace_id" }, { status: 400 });
  }

  // Hook/Receipt 形态目前未签发 visual 侧 connect_token，且 server-to-server
  // 使用 bridge 自带 token；当请求声明了 token 时校验，否则视为本地受信任来源。
  if (connectToken) {
    const tokenValidation = validateConnectToken({
      token: connectToken,
      workspaceId,
      agentId,
      secret:
        process.env.REALTIME_CONNECT_SECRET ?? "br-ai-spec-visual-dev-secret",
    });
    if (!tokenValidation.ok) {
      // hook-event / control-receipt 路径常用项目自有 connect_token，不一定能通过
      // visual 侧 HMAC，此处采用「松校验」：失败仅记日志，不阻断 ingest。
      console.warn("[ingest/raw] connect_token validation failed", tokenValidation);
    }
  }

  const rawEventsInput =
    (Array.isArray(body.raw_events) && (body.raw_events as unknown[])) ||
    (Array.isArray(body.rawEvents) && (body.rawEvents as unknown[])) ||
    [];

  const result = await ingestWorkspaceRawEvents({
    workspaceId,
    rootPath: typeof body.root_path === "string" ? body.root_path : null,
    rawEvents: rawEventsInput as Parameters<
      typeof ingestWorkspaceRawEvents
    >[0]["rawEvents"],
  });

  publishIngestProjectionEvent(workspaceId, {
    source_path: "/api/internal/ingest/raw",
    source_kind: String(body.source_kind ?? body.sourceKind ?? "unknown"),
    inserted_raw_count: result.insertedRawCount,
    projected_raw_count: result.projectedRawCount,
    skipped_raw_count: result.skippedRawCount,
  });

  return NextResponse.json({
    ok: true,
    source_kind: body.source_kind ?? body.sourceKind ?? "unknown",
    ...result,
  });
}
