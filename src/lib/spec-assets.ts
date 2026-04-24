import { glob } from "glob";
import path from "node:path";
import { stat } from "node:fs/promises";
import type { PrismaClient } from "@prisma/client";

export type SpecAssetSourceKind = "openspec" | "ai-spec-history";
export type SpecAssetStatus =
  | "draft"
  | "active"
  | "reviewing"
  | "archived"
  | "history"
  | "missing";

export type SpecAssetType =
  | "proposal"
  | "spec"
  | "design"
  | "tasks"
  | "checklist"
  | "iterations"
  | "bugfix"
  | "implementation-notes"
  | "archive"
  | "other";

export interface SpecAssetRecord {
  id: string;
  sourceKind: SpecAssetSourceKind;
  sourcePath: string;
  assetType: SpecAssetType;
  status: SpecAssetStatus;
  title?: string | null;
  workspaceId?: string | null;
  runId?: string | null;
  changeId?: string | null;
  roleCode?: string | null;
  updatedAt?: string | null;
}

export interface ClassifiedSpecAsset {
  sourceKind: SpecAssetSourceKind;
  sourcePath: string;
  assetType: SpecAssetType;
  status: SpecAssetStatus;
  title: string;
  runId: string | null;
  changeId: string | null;
}

export interface SpecAssetSummary {
  total: number;
  openspec: number;
  history: number;
  reviewing: number;
}

const TEXT_ASSET_GLOB = "**/*.{md,markdown,txt,json,yml,yaml}";
const SPEC_ASSET_SYNC_LOCKS = new Map<string, Promise<SpecAssetRecord[]>>();

function mapStoredSpecAsset(asset: {
  id: string;
  sourceKind: string;
  sourcePath: string;
  assetType: string;
  status: string;
  title: string | null;
  workspaceId: string;
  runId: string | null;
  changeId: string | null;
  roleCode: string | null;
  updatedAt: Date;
}) {
  return {
    id: asset.id,
    sourceKind:
      asset.sourceKind === "ai-spec-history" ? "ai-spec-history" : "openspec",
    sourcePath: asset.sourcePath,
    assetType: (asset.assetType as SpecAssetType) || "other",
    status: (asset.status as SpecAssetStatus) || "active",
    title: asset.title,
    workspaceId: asset.workspaceId,
    runId: asset.runId,
    changeId: asset.changeId,
    roleCode: asset.roleCode,
    updatedAt: asset.updatedAt.toISOString(),
  } satisfies SpecAssetRecord;
}

function normalizePath(input: string) {
  return input.replace(/\\/gu, "/").replace(/^\.\/+/u, "");
}

function toTitle(filePath: string) {
  return path.basename(filePath, path.extname(filePath));
}

function inferOpenSpecAssetType(filePath: string): SpecAssetType {
  const name = path.basename(filePath).toLowerCase();
  if (name === "proposal.md") return "proposal";
  if (name === "design.md") return "design";
  if (name === "tasks.md") return "tasks";
  if (name === "checklist.md") return "checklist";
  if (name === "iterations.md") return "iterations";
  if (name.startsWith("archive")) return "archive";
  if (name === "spec.md" || name === "specs.md" || filePath.includes("/specs/")) {
    return "spec";
  }
  return "other";
}

function inferHistoryAssetType(filePath: string): SpecAssetType {
  const name = path.basename(filePath).toLowerCase();
  if (name === "bugfix.md") return "bugfix";
  if (name === "implementation-notes.md") return "implementation-notes";
  if (name === "checklist.md") return "checklist";
  if (name === "iterations.md") return "iterations";
  return "other";
}

export function classifySpecAssetPath(
  rawPath: string,
): ClassifiedSpecAsset | null {
  const sourcePath = normalizePath(rawPath);

  if (sourcePath.startsWith("openspec/changes/")) {
    const parts = sourcePath.split("/");
    const changeId = parts[2] || null;
    const assetType = inferOpenSpecAssetType(sourcePath);
    return {
      sourceKind: "openspec",
      sourcePath,
      assetType,
      status: assetType === "archive" ? "archived" : "active",
      title: toTitle(sourcePath),
      runId: null,
      changeId,
    };
  }

  if (sourcePath.startsWith(".ai-spec/history/")) {
    const parts = sourcePath.split("/");
    const runId = parts[2] || null;
    return {
      sourceKind: "ai-spec-history",
      sourcePath,
      assetType: inferHistoryAssetType(sourcePath),
      status: "history",
      title: toTitle(sourcePath),
      runId,
      changeId: null,
    };
  }

  return null;
}

export function summarizeSpecAssets(
  assets: Array<
    Pick<SpecAssetRecord, "sourceKind" | "status"> &
      Partial<Pick<SpecAssetRecord, "id" | "assetType" | "sourcePath">>
  >,
): SpecAssetSummary {
  return assets.reduce<SpecAssetSummary>(
    (summary, asset) => {
      summary.total += 1;
      if (asset.sourceKind === "openspec") {
        summary.openspec += 1;
      } else {
        summary.history += 1;
      }
      if (asset.status === "reviewing") {
        summary.reviewing += 1;
      }
      return summary;
    },
    {
      total: 0,
      openspec: 0,
      history: 0,
      reviewing: 0,
    },
  );
}

export async function scanWorkspaceSpecAssets(rootPath: string) {
  const normalizedRoot = path.resolve(rootPath);
  const candidates = await Promise.all([
    glob(`openspec/changes/${TEXT_ASSET_GLOB}`, {
      cwd: normalizedRoot,
      nodir: true,
      dot: true,
    }),
    glob(`.ai-spec/history/run_*/${TEXT_ASSET_GLOB}`, {
      cwd: normalizedRoot,
      nodir: true,
      dot: true,
    }),
  ]);

  const files = [...candidates[0], ...candidates[1]];
  const records = await Promise.all(
    files.map(async (relativePath) => {
      const classified = classifySpecAssetPath(relativePath);
      if (!classified) return null;

      const fileStat = await stat(path.join(normalizedRoot, relativePath)).catch(
        () => null,
      );
      return {
        id: `${classified.sourceKind}:${classified.sourcePath}`,
        sourceKind: classified.sourceKind,
        sourcePath: classified.sourcePath,
        assetType: classified.assetType,
        status: classified.status,
        title: classified.title,
        runId: classified.runId,
        changeId: classified.changeId,
        updatedAt: fileStat?.mtime.toISOString() ?? null,
      } satisfies SpecAssetRecord;
    }),
  );

  return records.filter(
    (record): record is NonNullable<(typeof records)[number]> => Boolean(record),
  );
}

export async function syncWorkspaceSpecAssets(input: {
  workspaceId: string;
  rootPath: string | null;
}) {
  const existing = SPEC_ASSET_SYNC_LOCKS.get(input.workspaceId);
  if (existing) {
    return existing;
  }

  const task = performWorkspaceSpecAssetSync(input).finally(() => {
    SPEC_ASSET_SYNC_LOCKS.delete(input.workspaceId);
  });
  SPEC_ASSET_SYNC_LOCKS.set(input.workspaceId, task);
  return task;
}

async function performWorkspaceSpecAssetSync(input: {
  workspaceId: string;
  rootPath: string | null;
}) {
  const [{ prisma }] = await Promise.all([import("@/lib/db/prisma")]);
  if (!input.rootPath) {
    return (
      await prisma.specAsset.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { updatedAt: "desc" },
      })
    ).map(mapStoredSpecAsset);
  }

  const scanned = await scanWorkspaceSpecAssets(input.rootPath).catch(() => []);

  for (const asset of scanned) {
    await upsertSpecAssetWithRetry(prisma, input.workspaceId, asset);
  }

  return (
    await prisma.specAsset.findMany({
      where: { workspaceId: input.workspaceId },
      orderBy: { updatedAt: "desc" },
    })
  ).map(mapStoredSpecAsset);
}

async function upsertSpecAssetWithRetry(
  prisma: Pick<PrismaClient, "specAsset">,
  workspaceId: string,
  asset: SpecAssetRecord,
) {
  const payload = {
    runId: asset.runId ?? undefined,
    changeId: asset.changeId ?? undefined,
    assetType: asset.assetType,
    status: asset.status,
    title: asset.title ?? undefined,
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await prisma.specAsset.upsert({
        where: {
          workspaceId_sourceKind_sourcePath: {
            workspaceId,
            sourceKind: asset.sourceKind,
            sourcePath: asset.sourcePath,
          },
        },
        create: {
          workspaceId,
          sourceKind: asset.sourceKind,
          sourcePath: asset.sourcePath,
          ...payload,
        },
        update: payload,
      });
      return;
    } catch (error) {
      if (!isRecordChangedConflict(error) || attempt === 1) {
        throw error;
      }
      await prisma.specAsset.updateMany({
        where: {
          workspaceId,
          sourceKind: asset.sourceKind,
          sourcePath: asset.sourcePath,
        },
        data: payload,
      });
      return;
    }
  }
}

function isRecordChangedConflict(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  return message.includes("Record has changed since last read");
}
