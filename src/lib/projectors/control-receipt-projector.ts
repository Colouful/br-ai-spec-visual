import type {
  RawIngestEventDraft,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import type { Prisma } from "@prisma/client";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { readString, isJsonRecord } from "@/lib/ingest/source-utils";
import { prisma } from "@/lib/db/prisma";

/**
 * control.receipt 事件 projector
 *
 * 把来自 auto 侧的回执事件落到 control_outbox 表上，并产出一条 runEvent 让前端 Trace
 * Stream 可以观测到「approval applied / rejected / conflict」等关键节点。
 *
 * 注：与其他 projector 不同，本 projector 需要直接更新 control_outbox（而不是仅返回
 * batch），因此返回 batch 中只放 runEvents；DB 写入由 ingest-service 的 sideEffect 入口
 * 触发。为避免侵入 ingest-service，我们在 projector 内部直接调用 prisma 更新 outbox。
 */
export function projectControlReceiptRawEvent(
  rawEvent: RawIngestEventDraft | StoredRawIngestEvent,
) {
  const rawEventId = "id" in rawEvent ? rawEvent.id : rawEvent.dedupeKey;
  const batch = createEmptyProjectionBatch();
  const payload = rawEvent.payload;
  if (!isJsonRecord(payload)) {
    return batch;
  }

  const outboxId = readString(payload, "outbox_id");
  const result = readString(payload, "result");
  const reason = readString(payload, "reason");
  const command = readString(payload, "command");
  const occurredAt = readString(payload, "received_at") ?? rawEvent.occurredAt ?? null;

  if (outboxId && result) {
    const status = mapResultToStatus(result);
    const appliedSnapshot = isJsonRecord(payload.applied_state_snapshot)
      ? payload.applied_state_snapshot
      : null;
    void prisma.controlOutbox
      .update({
        where: { id: outboxId },
        data: {
          status,
          reason: reason ?? undefined,
          appliedSnapshot: appliedSnapshot
            ? (appliedSnapshot as Prisma.InputJsonObject)
            : undefined,
          appliedAt: status === "applied" ? new Date() : undefined,
          deliveredAt: new Date(),
        },
      })
      .catch(() => {
        // outbox 行可能已被其他通道处理或被清理，receipt 是 best-effort 同步
      });
  }

  const runId = readString(payload, "run_id") ?? readString(payload, "outbox_id") ?? "control";
  batch.runEvents.push({
    workspaceId: rawEvent.workspaceId ?? null,
    runKey: runId,
    eventKey: `${runId}:control.receipt:${outboxId ?? rawEventId}`,
    eventType: "control.receipt",
    occurredAt,
    sourceKind: rawEvent.sourceKind,
    rawEventId,
    payload: {
      outbox_id: outboxId,
      command,
      result,
      reason,
    },
  });

  return batch;
}

function mapResultToStatus(result: string) {
  switch (result) {
    case "applied":
      return "applied" as const;
    case "rejected":
      return "rejected" as const;
    case "conflict":
      return "conflict" as const;
    case "expired":
      return "expired" as const;
    default:
      return "delivered" as const;
  }
}
