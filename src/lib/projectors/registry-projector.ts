import type {
  JsonRecord,
  RawIngestEventDraft,
  RegistryRelationProjection,
  StoredRawIngestEvent,
} from "@/lib/contracts/ingest";
import { createEmptyProjectionBatch } from "@/lib/contracts/ingest";
import { isJsonRecord, readString, readStringArray } from "@/lib/ingest/source-utils";

type RelationConfig = {
  field: string;
  relationType: string;
  targetItemType?: string | null;
  mode?: "single" | "multiple";
};

const RELATION_CONFIG: RelationConfig[] = [
  { field: "rule_ids", relationType: "uses-rule", targetItemType: "rule" },
  { field: "skill_priority", relationType: "uses-skill", targetItemType: "skill" },
  { field: "profiles", relationType: "uses-profile", targetItemType: "profile" },
  { field: "required_roles", relationType: "requires-role", targetItemType: "role" },
  { field: "optional_roles", relationType: "optional-role", targetItemType: "role" },
  {
    field: "first_handoff",
    relationType: "first-handoff-role",
    targetItemType: "role",
    mode: "single",
  },
];

function readRelationTargets(item: JsonRecord, config: RelationConfig) {
  if (config.mode === "single") {
    const value = readString(item, config.field);

    return value ? [value] : [];
  }

  return readStringArray(item, config.field);
}

function buildRelations(params: {
  item: JsonRecord;
  registry: string;
  itemType: string;
  slug: string;
  rawEvent: RawIngestEventDraft | StoredRawIngestEvent;
}) {
  const rawEventId =
    "id" in params.rawEvent ? params.rawEvent.id : params.rawEvent.dedupeKey;

  return RELATION_CONFIG.flatMap((config) =>
    readRelationTargets(params.item, config).map(
      (targetSlug) =>
        ({
          workspaceId: params.rawEvent.workspaceId ?? null,
          sourceRegistry: params.registry,
          sourceItemType: params.itemType,
          sourceSlug: params.slug,
          relationType: config.relationType,
          targetItemType: config.targetItemType,
          targetSlug,
          rawEventId,
          payload: null,
        }) satisfies RegistryRelationProjection,
    ),
  );
}

export function projectRegistryRawEvent(
  rawEvent: RawIngestEventDraft | StoredRawIngestEvent,
) {
  const rawEventId = "id" in rawEvent ? rawEvent.id : rawEvent.dedupeKey;
  const batch = createEmptyProjectionBatch();
  const registry = rawEvent.payload.registry;
  const itemType = rawEvent.payload.category;
  const slug = rawEvent.payload.slug;
  const version = rawEvent.payload.version;
  const registryPath = rawEvent.payload.registryPath;
  const item = rawEvent.payload.item;

  if (
    typeof registry !== "string" ||
    typeof itemType !== "string" ||
    typeof slug !== "string" ||
    typeof registryPath !== "string" ||
    !isJsonRecord(item)
  ) {
    return batch;
  }

  batch.registryItems.push({
    workspaceId: rawEvent.workspaceId ?? null,
    registry,
    itemType,
    slug,
    name: readString(item, "name") ?? readString(item, "label") ?? slug,
    label: readString(item, "label") ?? null,
    status: readString(item, "status") ?? null,
    version: typeof version === "number" ? version : null,
    registryPath,
    sourcePath: readString(item, "source") ?? null,
    contentHash: rawEvent.checksum,
    rawEventId,
    payload: item,
  });

  batch.registryRelations.push(
    ...buildRelations({
      item,
      registry,
      itemType,
      slug,
      rawEvent,
    }),
  );

  return batch;
}
