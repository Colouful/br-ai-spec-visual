import type { DataSourceKind } from "@/lib/contracts/data-source";

export type JsonRecord = Record<string, unknown>;

export interface RawIngestEventDraft {
  workspaceId?: string | null;
  sourceKind: DataSourceKind;
  sourcePath: string;
  eventType: string;
  eventKey: string;
  dedupeKey: string;
  checksum: string;
  occurredAt?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload: JsonRecord;
}

export interface StoredRawIngestEvent extends RawIngestEventDraft {
  id: string;
  createdAt: string;
  projectedAt?: string | null;
  projectionStatus: "pending" | "projected";
}

export interface RegistryItemProjection {
  workspaceId?: string | null;
  registry: string;
  itemType: string;
  slug: string;
  name: string;
  label?: string | null;
  status?: string | null;
  version?: number | null;
  registryPath: string;
  sourcePath?: string | null;
  contentHash: string;
  rawEventId: string;
  payload: JsonRecord;
}

export interface RegistryRelationProjection {
  workspaceId?: string | null;
  sourceRegistry: string;
  sourceItemType: string;
  sourceSlug: string;
  relationType: string;
  targetItemType?: string | null;
  targetSlug: string;
  rawEventId: string;
  payload?: JsonRecord | null;
}

export interface OmxSessionProjection {
  workspaceId?: string | null;
  sessionKey: string;
  nativeSessionId?: string | null;
  pid?: number | null;
  status: string;
  startedAt?: string | null;
  lastSeenAt?: string | null;
  rawEventId: string;
  payload: JsonRecord;
}

export interface OmxTurnProjection {
  workspaceId?: string | null;
  sessionKey: string;
  turnKey: string;
  eventType: string;
  occurredAt?: string | null;
  inputPreview?: string | null;
  outputPreview?: string | null;
  rawEventId: string;
  payload: JsonRecord;
}

export interface RunEventProjection {
  workspaceId?: string | null;
  runKey: string;
  eventKey: string;
  eventType: string;
  occurredAt?: string | null;
  sourceKind: DataSourceKind;
  rawEventId: string;
  payload: JsonRecord;
}

export interface RunStateProjection {
  workspaceId?: string | null;
  runKey: string;
  status: string;
  lastEventType: string;
  lastEventAt?: string | null;
  turnCount: number;
  sourceKind: DataSourceKind;
  rawEventId: string;
  payload: JsonRecord;
}

export interface ChangeDocumentProjection {
  workspaceId?: string | null;
  changeKey: string;
  docType: string;
  title?: string | null;
  sourcePath: string;
  contentHash?: string | null;
  status?: string | null;
  rawEventId: string;
  payload: JsonRecord;
}

export interface ProjectionBatch {
  registryItems: RegistryItemProjection[];
  registryRelations: RegistryRelationProjection[];
  omxSessions: OmxSessionProjection[];
  omxTurns: OmxTurnProjection[];
  runEvents: RunEventProjection[];
  runStates: RunStateProjection[];
  changeDocuments: ChangeDocumentProjection[];
}

export interface PersistRawEventResult {
  inserted: boolean;
  record: StoredRawIngestEvent;
}

export interface IngestRawEventsResult {
  insertedRawCount: number;
  skippedRawCount: number;
  projectedRawCount: number;
}

export interface IngestRepository {
  persistRawEvent(rawEvent: RawIngestEventDraft): Promise<PersistRawEventResult>;
  applyProjection(batch: ProjectionBatch): Promise<void>;
  markRawEventProjected(rawEventId: string): Promise<void>;
}

export function createEmptyProjectionBatch(): ProjectionBatch {
  return {
    registryItems: [],
    registryRelations: [],
    omxSessions: [],
    omxTurns: [],
    runEvents: [],
    runStates: [],
    changeDocuments: [],
  };
}
