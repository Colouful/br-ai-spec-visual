import type { DataSourceFileInput } from "@/lib/contracts/data-source";
import type { JsonRecord, RawIngestEventDraft } from "@/lib/contracts/ingest";
import { hashText, hashValue, isJsonRecord, parseJsonRecord } from "@/lib/ingest/source-utils";
import { projectRegistryRawEvent } from "@/lib/projectors/registry-projector";

const NON_COLLECTION_KEYS = new Set(["version", "support_files"]);

const CATEGORY_BY_COLLECTION: Record<string, string> = {
  flows: "flow",
  profiles: "profile",
  roles: "role",
  rules: "rule",
  scenario_packages: "scenario-package",
  skills: "skill",
};

function normalizeCollectionKey(value: string) {
  return value.replace(/-/gu, "_");
}

function inferRegistryName(sourcePath: string) {
  if (sourcePath.startsWith(".agents/registry/")) {
    return "agents";
  }

  const [segment = "workspace"] = sourcePath.split("/");

  return segment.replace(/^\./u, "") || "workspace";
}

function inferCollectionKey(root: JsonRecord, sourcePath: string) {
  const explicitKeys = Object.keys(root).filter((key) => !NON_COLLECTION_KEYS.has(key));

  if (explicitKeys.length === 1) {
    return explicitKeys[0];
  }

  const fileName = sourcePath.split("/").pop() ?? sourcePath;
  const basename = fileName.replace(/\.json$/u, "");
  const normalized = normalizeCollectionKey(basename);

  if (normalized in root) {
    return normalized;
  }

  if (explicitKeys.length > 0) {
    return explicitKeys[0];
  }

  throw new Error(`${sourcePath} 缺少可识别的注册表集合`);
}

export function parseRegistrySource(
  input: DataSourceFileInput,
): RawIngestEventDraft[] {
  const sourcePath = input.sourcePath ?? input.filePath;

  if (!sourcePath) {
    throw new Error("registry 数据源缺少 sourcePath/filePath");
  }

  const root = parseJsonRecord(input.content, sourcePath);
  const collectionKey = inferCollectionKey(root, sourcePath);
  const category = CATEGORY_BY_COLLECTION[normalizeCollectionKey(collectionKey)] ?? "item";
  const registry = inferRegistryName(sourcePath);
  const collection = root[collectionKey];
  const version = typeof root.version === "number" ? root.version : null;

  if (!isJsonRecord(collection)) {
    throw new Error(`${input.sourcePath} 的 ${collectionKey} 必须是对象`);
  }

  return Object.entries(collection).map(([slug, item]) => {
    if (!isJsonRecord(item)) {
      throw new Error(`${input.sourcePath} 的 ${slug} 必须是对象`);
    }

    const checksum = hashValue(item);
    const eventKey = `${category}:${slug}:v${version ?? 0}:${checksum.slice(0, 12)}`;
    const dedupeKey = hashText(
      ["registry-json", sourcePath, eventKey, checksum].join("|"),
    );

    return {
      workspaceId: input.workspaceId ?? null,
      sourceKind: "registry-json",
      sourcePath,
      eventType: `registry.${category}.snapshot`,
      eventKey,
      dedupeKey,
      checksum,
      entityType: category,
      entityId: slug,
      occurredAt: null,
      payload: {
        category,
        item,
        registry,
        registryPath: sourcePath,
        slug,
        version,
      },
    } satisfies RawIngestEventDraft;
  });
}

export interface ParsedRegistryRelation {
  workspaceId?: string | null;
  sourceCategory: string;
  sourceSlug: string;
  relationType: string;
  targetCategory?: string | null;
  targetSlug: string;
}

export interface ParsedRegistryItem {
  workspaceId?: string | null;
  category: string;
  slug: string;
  name: string;
  label?: string | null;
  status?: string | null;
  sourcePath?: string | null;
  version?: number | null;
  payload: JsonRecord;
}

export function parseRegistryFile(input: DataSourceFileInput) {
  const projections = parseRegistrySource(input).map((rawEvent) =>
    projectRegistryRawEvent({
      ...rawEvent,
      id: rawEvent.dedupeKey,
      createdAt: new Date(0).toISOString(),
      projectedAt: null,
      projectionStatus: "pending",
    }),
  );

  const items = projections.flatMap((projection) =>
    projection.registryItems.map((item) => ({
      workspaceId: item.workspaceId,
      category: item.itemType,
      slug: item.slug,
      name: item.name,
      label: item.label,
      status: item.status,
      sourcePath: item.sourcePath,
      version: item.version,
      payload: item.payload,
    })),
  );

  const relations = projections.flatMap((projection) =>
    projection.registryRelations.map((relation) => ({
      workspaceId: relation.workspaceId,
      sourceCategory: relation.sourceItemType,
      sourceSlug: relation.sourceSlug,
      relationType: relation.relationType,
      targetCategory: relation.targetItemType,
      targetSlug: relation.targetSlug,
    })),
  );

  return { items, relations };
}
