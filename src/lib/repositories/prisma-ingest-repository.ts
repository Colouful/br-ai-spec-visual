import { Prisma } from "@prisma/client";
import type { PrismaClient, RawIngestEvent } from "@prisma/client";

import type {
  IngestRepository,
  PersistRawEventResult,
  ProjectionBatch,
  RawIngestEventDraft,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { maxIsoTimestamp } from "@/lib/repositories/helpers";

function toDate(value?: string | null) {
  return value ? new Date(value) : undefined;
}

function toJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function mapRawIngestEvent(record: RawIngestEvent): StoredRawIngestEvent {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    sourceKind: record.sourceType as StoredRawIngestEvent["sourceKind"],
    sourcePath: record.sourcePath,
    eventType: record.eventType,
    eventKey: record.eventId,
    dedupeKey: record.idempotencyKey,
    checksum: record.contentHash,
    occurredAt: record.occurredAt.toISOString(),
    payload: (record.payload ?? {}) as StoredRawIngestEvent["payload"],
    createdAt: record.createdAt.toISOString(),
    projectedAt: null,
    projectionStatus: "pending",
  };
}

export class PrismaIngestRepository implements IngestRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async persistRawEvent(
    rawEvent: RawIngestEventDraft,
  ): Promise<PersistRawEventResult> {
    const existing = await this.db.rawIngestEvent.findFirst({
      where: {
        OR: [
          {
            idempotencyKey: rawEvent.dedupeKey,
          },
          {
            workspaceId: rawEvent.workspaceId ?? "global",
            eventId: rawEvent.eventKey,
          },
        ],
      },
    });

    if (existing) {
      return {
        inserted: false,
        record: mapRawIngestEvent(existing),
      };
    }

    try {
      const record = await this.db.rawIngestEvent.create({
        data: {
          workspaceId: rawEvent.workspaceId ?? "global",
          sourceType: rawEvent.sourceKind,
          sourcePath: rawEvent.sourcePath,
          eventType: rawEvent.eventType,
          eventId: rawEvent.eventKey,
          idempotencyKey: rawEvent.dedupeKey,
          contentHash: rawEvent.checksum,
          occurredAt: toDate(rawEvent.occurredAt) ?? new Date(),
          payload: toJson({
            entityId: rawEvent.entityId ?? null,
            entityType: rawEvent.entityType ?? null,
            ...rawEvent.payload,
          }),
        },
      });

      return {
        inserted: true,
        record: mapRawIngestEvent(record),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const duplicate = await this.db.rawIngestEvent.findFirstOrThrow({
          where: {
            OR: [
              {
                idempotencyKey: rawEvent.dedupeKey,
              },
              {
                workspaceId: rawEvent.workspaceId ?? "global",
                eventId: rawEvent.eventKey,
              },
            ],
          },
        });

        return {
          inserted: false,
          record: mapRawIngestEvent(duplicate),
        };
      }

      throw error;
    }
  }

  async applyProjection(batch: ProjectionBatch) {
    await this.db.$transaction(async (tx) => {
      for (const item of batch.registryItems) {
        await tx.registryItem.upsert({
          where: {
            workspaceId_category_slug: {
              workspaceId: item.workspaceId ?? "global",
              category: item.itemType,
              slug: item.slug,
            },
          },
          create: {
            workspaceId: item.workspaceId ?? "global",
            category: item.itemType,
            slug: item.slug,
            name: item.name,
            label: item.label ?? undefined,
            status: item.status ?? undefined,
            version: item.version ?? 1,
            sourcePath: item.sourcePath ?? item.registryPath,
            payload: toJson({
              registry: item.registry,
              registryPath: item.registryPath,
              rawEventId: item.rawEventId,
              ...item.payload,
            }),
          },
          update: {
            name: item.name,
            label: item.label ?? undefined,
            status: item.status ?? undefined,
            version: item.version ?? 1,
            sourcePath: item.sourcePath ?? item.registryPath,
            payload: toJson({
              registry: item.registry,
              registryPath: item.registryPath,
              rawEventId: item.rawEventId,
              ...item.payload,
            }),
          },
        });
      }

      for (const relation of batch.registryRelations) {
        await tx.registryRelation.upsert({
          where: {
            workspaceId_sourceCategory_sourceSlug_relationType_targetSlug: {
              workspaceId: relation.workspaceId ?? "global",
              sourceCategory: relation.sourceItemType,
              sourceSlug: relation.sourceSlug,
              relationType: relation.relationType,
              targetSlug: relation.targetSlug,
            },
          },
          create: {
            workspaceId: relation.workspaceId ?? "global",
            sourceCategory: relation.sourceItemType,
            sourceSlug: relation.sourceSlug,
            relationType: relation.relationType,
            targetSlug: relation.targetSlug,
          },
          update: {
            relationType: relation.relationType,
          },
        });
      }

      for (const session of batch.omxSessions) {
        await tx.omxSession.upsert({
          where: {
            workspaceId_sessionKey: {
              workspaceId: session.workspaceId ?? "global",
              sessionKey: session.sessionKey,
            },
          },
          create: {
            workspaceId: session.workspaceId ?? "global",
            sessionKey: session.sessionKey,
            nativeSessionId: session.nativeSessionId ?? undefined,
            event: session.status,
            pid: session.pid ?? undefined,
            timestamp: toDate(session.lastSeenAt ?? session.startedAt) ?? new Date(),
          },
          update: {
            nativeSessionId: session.nativeSessionId ?? undefined,
            event: session.status,
            pid: session.pid ?? undefined,
            timestamp: toDate(session.lastSeenAt ?? session.startedAt) ?? new Date(),
          },
        });
      }

      for (const turn of batch.omxTurns) {
        await tx.omxTurn.upsert({
          where: {
            workspaceId_turnKey: {
              workspaceId: turn.workspaceId ?? "global",
              turnKey: turn.turnKey,
            },
          },
          create: {
            workspaceId: turn.workspaceId ?? "global",
            sessionKey: turn.sessionKey,
            turnKey: turn.turnKey,
            type: turn.eventType,
            timestamp: toDate(turn.occurredAt) ?? new Date(),
            inputPreview: turn.inputPreview ?? undefined,
            outputPreview: turn.outputPreview ?? undefined,
          },
          update: {
            sessionKey: turn.sessionKey,
            type: turn.eventType,
            timestamp: toDate(turn.occurredAt) ?? new Date(),
            inputPreview: turn.inputPreview ?? undefined,
            outputPreview: turn.outputPreview ?? undefined,
          },
        });
      }

      for (const event of batch.runEvents) {
        const workspaceId = event.workspaceId ?? "global";
        const occurredAt = toDate(event.occurredAt) ?? new Date();
        const existing = await tx.runEvent.findFirst({
          where: {
            workspaceId,
            runKey: event.runKey,
            eventType: event.eventType,
            occurredAt,
          },
        });
        if (!existing) {
          await tx.runEvent.create({
            data: {
              workspaceId,
              runKey: event.runKey,
              eventType: event.eventType,
              occurredAt,
              payload: toJson({
                eventKey: event.eventKey,
                sourceKind: event.sourceKind,
                rawEventId: event.rawEventId,
                ...event.payload,
              }),
            },
          });
        }
      }

      for (const state of batch.runStates) {
        const workspaceId = state.workspaceId ?? "global";
        const existing = await tx.runState.findUnique({
          where: {
            workspaceId_runKey: {
              workspaceId,
              runKey: state.runKey,
            },
          },
        });

        const nextLastOccurredAt =
          toDate(
            maxIsoTimestamp(
              existing?.lastOccurredAt?.toISOString() ?? null,
              state.lastEventAt,
            ),
          ) ?? new Date();

        if (!existing) {
          await tx.runState.create({
            data: {
              workspaceId,
              runKey: state.runKey,
              status: state.status,
              lastEventType: state.lastEventType,
              lastOccurredAt: nextLastOccurredAt,
              turnCount: state.turnCount,
              payload: toJson({
                sourceKind: state.sourceKind,
                rawEventId: state.rawEventId,
                ...state.payload,
              }),
            },
          });
          continue;
        }

        await tx.runState.update({
          where: {
            workspaceId_runKey: {
              workspaceId,
              runKey: state.runKey,
            },
          },
          data: {
            status: state.status,
            lastEventType: state.lastEventType,
            lastOccurredAt: nextLastOccurredAt,
            turnCount:
              state.sourceKind === "run-state-json"
                ? Math.max(existing.turnCount, state.turnCount)
                : existing.turnCount + state.turnCount,
            payload: toJson({
              sourceKind: state.sourceKind,
              rawEventId: state.rawEventId,
              ...state.payload,
            }),
          },
        });
      }

      for (const document of batch.changeDocuments) {
        await tx.changeDocument.upsert({
          where: {
            workspaceId_changeKey_docType_sourcePath: {
              workspaceId: document.workspaceId ?? "global",
              changeKey: document.changeKey,
              docType: document.docType,
              sourcePath: document.sourcePath,
            },
          },
          create: {
            workspaceId: document.workspaceId ?? "global",
            changeKey: document.changeKey,
            docType: document.docType,
            title: document.title ?? undefined,
            sourcePath: document.sourcePath,
            contentHash: document.contentHash ?? undefined,
            status: document.status ?? undefined,
            payload: toJson({
              rawEventId: document.rawEventId,
              ...document.payload,
            }),
          },
          update: {
            title: document.title ?? undefined,
            contentHash: document.contentHash ?? undefined,
            status: document.status ?? undefined,
            payload: toJson({
              rawEventId: document.rawEventId,
              ...document.payload,
            }),
          },
        });
      }
    });
  }

  async markRawEventProjected(rawEventId: string) {
    void rawEventId;
    return;
  }
}
