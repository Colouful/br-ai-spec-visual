import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createRealtimeEnvelope } from "@/server/realtime";
import { publishEventToWorkspace } from "@/server/ws-server";

const gateDecisionSchema = z.object({
  comment: z.string().trim().min(1).optional(),
  reviewer: z.string().trim().min(1).optional(),
  requestedAssets: z.array(z.string().trim().min(1)).optional().default([]),
});

export type GateDecisionKind = "approve" | "reject" | "request-changes";
type GateOutboxCommandKind = "approve_gate" | "reject_gate";

export function mapGateDecisionToOutboxCommand(
  decision: GateDecisionKind,
): GateOutboxCommandKind {
  return decision === "approve" ? "approve_gate" : "reject_gate";
}

export function buildGateOutboxPayload(input: {
  decision: GateDecisionKind;
  gateType: string;
  runId: string;
  comment?: string;
  reviewer?: string;
  requestedAssets?: string[];
}) {
  return {
    gate: input.gateType,
    run_id: input.runId,
    decision:
      input.decision === "approve"
        ? "approved"
        : input.decision === "reject"
          ? "rejected"
          : "request_changes",
    reason: input.comment,
    requested_assets: input.requestedAssets ?? [],
    requested_by: input.reviewer ?? null,
  };
}

function timelineTitle(decision: GateDecisionKind) {
  switch (decision) {
    case "approve":
      return "门禁审批已通过";
    case "reject":
      return "门禁审批已驳回";
    case "request-changes":
      return "门禁要求补充后重审";
  }
}

function gateEventType(decision: GateDecisionKind) {
  switch (decision) {
    case "approve":
      return "gate.approved";
    case "reject":
      return "gate.rejected";
    case "request-changes":
      return "gate.request_changes";
  }
}

export async function handleGateDecision(input: {
  workspaceId: string;
  runId: string;
  gateId: string;
  decision: GateDecisionKind;
  request: Request;
}) {
  const [{ requireApiRole }, { prisma }, { enqueueControlOutbox }] =
    await Promise.all([
      import("@/lib/auth/api-guard"),
      import("@/lib/db/prisma"),
      import("@/server/control-outbox"),
    ]);
  const guard = await requireApiRole("maintainer");
  if ("response" in guard) return guard.response;

  const body = gateDecisionSchema.parse(await input.request.json().catch(() => ({})));
  const gate = await prisma.gateApproval.findFirst({
    where: {
      id: input.gateId,
      workspaceId: input.workspaceId,
      runId: input.runId,
    },
  });

  if (!gate) {
    return NextResponse.json({ error: "gate not found" }, { status: 404 });
  }

  const reviewer = body.reviewer ?? guard.user.email;
  const now = new Date();
  const nextStatus = input.decision === "approve" ? "approved" : "rejected";
  const resolution =
    input.decision === "request-changes" ? "request_changes" : input.decision;

  const updatedGate = await prisma.gateApproval.update({
    where: { id: gate.id },
    data: {
      status: nextStatus,
      resolution,
      comment: body.comment ?? null,
      reviewer,
      approvedAt: input.decision === "approve" ? now : undefined,
      rejectedAt: input.decision !== "approve" ? now : undefined,
      requiredAssetsJson:
        body.requestedAssets.length > 0 ? body.requestedAssets : undefined,
    },
  });

  const timelineEvent = await prisma.timelineEvent.create({
    data: {
      workspaceId: input.workspaceId,
      runId: input.runId,
      nodeId: gate.nodeId,
      type: gateEventType(input.decision),
      title: timelineTitle(input.decision),
      payload: {
        gateId: gate.id,
        gateType: gate.gateType,
        reviewer,
        comment: body.comment ?? null,
        requestedAssets: body.requestedAssets,
        resolution,
      },
    },
  });

  await enqueueControlOutbox({
    workspaceId: input.workspaceId,
    runKey: input.runId,
    command: mapGateDecisionToOutboxCommand(input.decision),
    actorId: guard.user.id,
    payload: buildGateOutboxPayload({
      decision: input.decision,
      gateType: gate.gateType,
      runId: input.runId,
      comment: body.comment,
      reviewer,
      requestedAssets: body.requestedAssets,
    }),
  });

  const gateEvent = createRealtimeEnvelope({
    workspaceId: input.workspaceId,
    agentId: guard.user.id,
    connectToken: "server",
    capabilities: ["bridge:server"],
    sourceType: "server",
    eventType: gateEventType(input.decision),
    payload: {
      gateId: gate.id,
      runId: input.runId,
      decision: resolution,
      reviewer,
    },
    sourcePath: `/api/workspaces/${input.workspaceId}/runs/${input.runId}/gate/${gate.id}/${input.decision}`,
  });
  publishEventToWorkspace(input.workspaceId, "browser", gateEvent);

  const nodeEvent = createRealtimeEnvelope({
    workspaceId: input.workspaceId,
    agentId: guard.user.id,
    connectToken: "server",
    capabilities: ["bridge:server"],
    sourceType: "server",
    eventType: "flow.node.updated",
    payload: {
      nodeId: gate.nodeId,
      runId: input.runId,
      status: nextStatus,
    },
    sourcePath: `/api/workspaces/${input.workspaceId}/runs/${input.runId}/gate/${gate.id}/${input.decision}`,
  });
  publishEventToWorkspace(input.workspaceId, "browser", nodeEvent);

  return NextResponse.json({
    gate: updatedGate,
    timelineEvent,
  });
}

export function buildDraftGateApproval(input: {
  workspaceId: string;
  runId: string;
  nodeId: string;
  roleCode: string;
  gateType: string;
  reason?: string | null;
  requiredAssets?: unknown;
}) {
  return {
    id: `gate_${nanoid(10)}`,
    workspaceId: input.workspaceId,
    runId: input.runId,
    nodeId: input.nodeId,
    roleCode: input.roleCode,
    gateType: input.gateType,
    status: "waiting-approval",
    mode: "main-flow-blocking",
    reason: input.reason ?? null,
    requiredAssetsJson: input.requiredAssets ?? [],
  };
}
