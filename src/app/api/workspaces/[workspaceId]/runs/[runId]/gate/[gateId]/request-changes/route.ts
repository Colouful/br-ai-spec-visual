import { handleGateDecision } from "@/server/gate-approval";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ workspaceId: string; runId: string; gateId: string }>;
  },
) {
  const { workspaceId, runId, gateId } = await context.params;
  return handleGateDecision({
    workspaceId,
    runId,
    gateId,
    decision: "request-changes",
    request,
  });
}
