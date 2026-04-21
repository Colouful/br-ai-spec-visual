import type {
  IngestRepository,
  PersistRawEventResult,
  ProjectionBatch,
  RawIngestEventDraft,
  RegistryItemProjection,
  RegistryRelationProjection,
  RunEventProjection,
  RunStateProjection,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import {
  maxIsoTimestamp,
  mergeDefined,
  toWorkspaceKey,
} from "@/lib/repositories/helpers";

type Snapshot = {
  rawIngestEvents: StoredRawIngestEvent[];
  registryItems: RegistryItemProjection[];
  registryRelations: RegistryRelationProjection[];
  omxSessions: ProjectionBatch["omxSessions"];
  omxTurns: ProjectionBatch["omxTurns"];
  runEvents: RunEventProjection[];
  runStates: RunStateProjection[];
  changeDocuments: ProjectionBatch["changeDocuments"];
};

function nowIso() {
  return new Date().toISOString();
}

function registryItemKey(item: RegistryItemProjection) {
  return [
    toWorkspaceKey(item.workspaceId),
    item.registry,
    item.itemType,
    item.slug,
  ].join("|");
}

function registryRelationKey(relation: RegistryRelationProjection) {
  return [
    toWorkspaceKey(relation.workspaceId),
    relation.sourceRegistry,
    relation.sourceItemType,
    relation.sourceSlug,
    relation.relationType,
    relation.targetItemType ?? "",
    relation.targetSlug,
  ].join("|");
}

function omxSessionKey(session: ProjectionBatch["omxSessions"][number]) {
  return [toWorkspaceKey(session.workspaceId), session.sessionKey].join("|");
}

function omxTurnKey(turn: ProjectionBatch["omxTurns"][number]) {
  return [toWorkspaceKey(turn.workspaceId), turn.turnKey].join("|");
}

function runEventKey(event: RunEventProjection) {
  return [toWorkspaceKey(event.workspaceId), event.runKey, event.eventKey].join("|");
}

function runStateKey(state: RunStateProjection) {
  return [toWorkspaceKey(state.workspaceId), state.runKey].join("|");
}

function changeDocumentKey(document: ProjectionBatch["changeDocuments"][number]) {
  return [
    toWorkspaceKey(document.workspaceId),
    document.changeKey,
    document.docType,
    document.sourcePath,
  ].join("|");
}

export class InMemoryIngestRepository implements IngestRepository {
  private readonly rawEvents = new Map<string, StoredRawIngestEvent>();
  private readonly registryItemsMap = new Map<string, RegistryItemProjection>();
  private readonly registryRelationsMap = new Map<
    string,
    RegistryRelationProjection
  >();
  private readonly omxSessionsMap = new Map<
    string,
    ProjectionBatch["omxSessions"][number]
  >();
  private readonly omxTurnsMap = new Map<string, ProjectionBatch["omxTurns"][number]>();
  private readonly runEventsMap = new Map<string, RunEventProjection>();
  private readonly runStatesMap = new Map<string, RunStateProjection>();
  private readonly changeDocumentsMap = new Map<
    string,
    ProjectionBatch["changeDocuments"][number]
  >();

  async persistRawEvent(
    rawEvent: RawIngestEventDraft,
  ): Promise<PersistRawEventResult> {
    const existing = this.rawEvents.get(rawEvent.dedupeKey);

    if (existing) {
      return {
        inserted: false,
        record: existing,
      };
    }

    const record: StoredRawIngestEvent = {
      ...rawEvent,
      id: rawEvent.dedupeKey,
      createdAt: nowIso(),
      projectedAt: null,
      projectionStatus: "pending",
    };

    this.rawEvents.set(record.dedupeKey, record);

    return {
      inserted: true,
      record,
    };
  }

  async applyProjection(batch: ProjectionBatch) {
    for (const item of batch.registryItems) {
      this.registryItemsMap.set(
        registryItemKey(item),
        mergeDefined(
          this.registryItemsMap.get(registryItemKey(item)) ?? item,
          item,
        ),
      );
    }

    for (const relation of batch.registryRelations) {
      this.registryRelationsMap.set(registryRelationKey(relation), relation);
    }

    for (const session of batch.omxSessions) {
      const key = omxSessionKey(session);
      const current = this.omxSessionsMap.get(key);

      this.omxSessionsMap.set(
        key,
        current
          ? {
              ...mergeDefined(current, session),
              lastSeenAt: maxIsoTimestamp(current.lastSeenAt, session.lastSeenAt),
            }
          : session,
      );
    }

    for (const turn of batch.omxTurns) {
      this.omxTurnsMap.set(omxTurnKey(turn), turn);
    }

    for (const event of batch.runEvents) {
      this.runEventsMap.set(runEventKey(event), event);
    }

    for (const state of batch.runStates) {
      const key = runStateKey(state);
      const current = this.runStatesMap.get(key);

      if (!current) {
        this.runStatesMap.set(key, state);
        continue;
      }

      const lastEventAt = maxIsoTimestamp(current.lastEventAt, state.lastEventAt);
      const useIncoming =
        lastEventAt === state.lastEventAt || current.lastEventAt === null;

      this.runStatesMap.set(key, {
        ...mergeDefined(current, state),
        lastEventAt,
        lastEventType: useIncoming ? state.lastEventType : current.lastEventType,
        status: useIncoming ? state.status : current.status,
        turnCount:
          state.sourceKind === "run-state-json"
            ? Math.max(current.turnCount, state.turnCount)
            : current.turnCount + state.turnCount,
      });
    }

    for (const document of batch.changeDocuments) {
      this.changeDocumentsMap.set(changeDocumentKey(document), document);
    }
  }

  async markRawEventProjected(rawEventId: string) {
    const record = [...this.rawEvents.values()].find((entry) => entry.id === rawEventId);

    if (!record) {
      return;
    }

    this.rawEvents.set(record.dedupeKey, {
      ...record,
      projectedAt: nowIso(),
      projectionStatus: "projected",
    });
  }

  snapshot(): Snapshot {
    return {
      rawIngestEvents: [...this.rawEvents.values()],
      registryItems: [...this.registryItemsMap.values()],
      registryRelations: [...this.registryRelationsMap.values()],
      omxSessions: [...this.omxSessionsMap.values()],
      omxTurns: [...this.omxTurnsMap.values()],
      runEvents: [...this.runEventsMap.values()],
      runStates: [...this.runStatesMap.values()],
      changeDocuments: [...this.changeDocumentsMap.values()],
    };
  }
}
