import { NextResponse } from "next/server";

import { validateConnectToken } from "@/server/connect-token";
import { publishIngestProjectionEvent } from "@/server/ws-server";
import { ingestWorkspaceRawEvents } from "@/lib/services/ingest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const tokenValidation = validateConnectToken({
    token: String(body.connect_token ?? ""),
    workspaceId: String(body.workspace_id ?? ""),
    agentId: String(body.agent_id ?? ""),
    secret: process.env.REALTIME_CONNECT_SECRET ?? "br-ai-spec-visual-dev-secret",
  });

  if (!tokenValidation.ok) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        details: tokenValidation,
      },
      { status: 401 },
    );
  }

  const result = await ingestWorkspaceRawEvents({
    workspaceId: String(body.workspace_id),
    rawEvents: Array.isArray(body.raw_events) ? body.raw_events : [],
  });

  publishIngestProjectionEvent(String(body.workspace_id), {
    source_path: "/api/internal/ingest/run-state",
    source_kind: String(body.source_kind ?? "run-state-json"),
    inserted_raw_count: result.insertedRawCount,
    projected_raw_count: result.projectedRawCount,
    skipped_raw_count: result.skippedRawCount,
  });

  return NextResponse.json({
    ok: true,
    source_kind: body.source_kind ?? "run-state-json",
    ...result,
  });
}
