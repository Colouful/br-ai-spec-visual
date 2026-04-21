import { createHmac } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import type { ControlCommand } from "@/lib/contracts/control";
import { writeOutboxToFileInbox } from "@/server/control-file-transport";

export type OutboxCommandKind =
  | "approve_gate"
  | "reject_gate"
  | "resume_run"
  | "cancel_run";

export type EnqueueOutboxInput = {
  workspaceId: string;
  runKey: string;
  command: OutboxCommandKind;
  payload: Record<string, unknown>;
  actorId?: string | null;
  signingSecret?: string | null;
  ttlMinutes?: number;
};

function signPayload(input: {
  outboxId: string;
  command: OutboxCommandKind;
  payload: Record<string, unknown>;
  secret: string;
}) {
  const message = JSON.stringify({
    outbox_id: input.outboxId,
    command: input.command,
    payload: input.payload,
  });
  return createHmac("sha256", input.secret).update(message).digest("hex");
}

export async function enqueueControlOutbox(input: EnqueueOutboxInput) {
  const ttlMinutes = input.ttlMinutes ?? 60;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  const created = await prisma.controlOutbox.create({
    data: {
      workspaceId: input.workspaceId,
      runKey: input.runKey,
      command: input.command,
      payload: input.payload,
      actorId: input.actorId ?? null,
      signature: "",
      expiresAt,
    },
  });

  const secret =
    input.signingSecret ||
    process.env.AI_SPEC_BRIDGE_SECRET ||
    process.env.REALTIME_CONNECT_SECRET ||
    "br-ai-spec-visual-dev-secret";

  const signature = signPayload({
    outboxId: created.id,
    command: input.command,
    payload: input.payload,
    secret,
  });

  const updated = await prisma.controlOutbox.update({
    where: { id: created.id },
    data: { signature },
  });

  // 文件 fallback：仅在 visual 与 auto 共享文件系统时生效；失败保持静默。
  void writeOutboxToFileInbox({
    workspaceId: updated.workspaceId,
    outboxId: updated.id,
    command: updated.command,
    payload: updated.payload as Record<string, unknown>,
    signature: updated.signature,
    expiresAt: updated.expiresAt,
  }).catch(() => undefined);

  return updated;
}

export type PendingFilter = {
  workspaceId: string;
  since?: string | null;
  limit?: number;
};

export async function listPendingOutbox(filter: PendingFilter) {
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const sinceDate = filter.since ? new Date(filter.since) : null;

  const items = await prisma.controlOutbox.findMany({
    where: {
      workspaceId: filter.workspaceId,
      status: { in: ["pending", "delivered"] },
      ...(sinceDate && !Number.isNaN(sinceDate.getTime())
        ? { createdAt: { gt: sinceDate } }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (items.length > 0) {
    await prisma.controlOutbox.updateMany({
      where: {
        id: { in: items.map((row) => row.id) },
        status: "pending",
      },
      data: {
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
  }

  return items.map((row) => ({
    outbox_id: row.id,
    workspace_id: row.workspaceId,
    run_id: row.runKey,
    command: row.command,
    payload: row.payload,
    signature: row.signature,
    actor_id: row.actorId,
    created_at: row.createdAt.toISOString(),
    expires_at: row.expiresAt?.toISOString() ?? null,
    status: row.status,
  }));
}

export function commandFromControlCommand(
  command: ControlCommand,
): OutboxCommandKind {
  if (command.command === "approve") {
    return command.decision === "rejected" ? "reject_gate" : "approve_gate";
  }
  if (command.command === "resume") {
    return "resume_run";
  }
  return "approve_gate";
}
