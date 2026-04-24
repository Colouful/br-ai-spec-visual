import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

export interface HubLockAsset {
  kind: string;
  assetId: string;
  version: string;
  required?: boolean;
  checksum?: string;
  currentChecksum?: string | null;
  installPath?: string;
  path?: string;
  riskLevel?: string;
  status?: string;
}

export interface HubLockProfile {
  detected: boolean;
  manifestId: string | null;
  manifestVersion: string | null;
  manifestChecksum: string | null;
  mode: string | null;
  installedAt: string | null;
  assetCount: number;
  outdatedAssets: HubLockAsset[];
  localChangedAssets: HubLockAsset[];
  highRiskAssets: HubLockAsset[];
  assets: HubLockAsset[];
  sourcePath: string | null;
}

export const EMPTY_HUB_LOCK_PROFILE: HubLockProfile = {
  detected: false,
  manifestId: null,
  manifestVersion: null,
  manifestChecksum: null,
  mode: null,
  installedAt: null,
  assetCount: 0,
  outdatedAssets: [],
  localChangedAssets: [],
  highRiskAssets: [],
  assets: [],
  sourcePath: null,
};

function safeReadJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function findHubLock(rootPath: string) {
  const candidates = [
    path.join(rootPath, "hub-lock.json"),
    path.join(rootPath, ".agents", "registry", "hub-lock.json"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sha256File(filePath: string) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath, "utf8")).digest("hex");
  } catch {
    return null;
  }
}

function normalizeAsset(value: unknown, rootPath: string): HubLockAsset {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const installPath = asString(item.installPath) || asString(item.path);
  const currentChecksum =
    typeof item.currentChecksum === "string"
      ? item.currentChecksum
      : installPath
        ? sha256File(path.join(rootPath, installPath))
        : null;
  return {
    kind: asString(item.kind) || "unknown",
    assetId: asString(item.assetId) || asString(item.slug) || asString(item.id),
    version: asString(item.version),
    required: item.required === true,
    checksum: asString(item.checksum),
    currentChecksum,
    installPath,
    path: installPath,
    riskLevel: asString(item.riskLevel) || "L0",
    status: asString(item.status),
  };
}

export function readHubLockProfile(rootPath: string | null): HubLockProfile {
  if (!rootPath) return EMPTY_HUB_LOCK_PROFILE;
  const resolvedRoot = path.resolve(rootPath);
  const lockPath = findHubLock(resolvedRoot);
  if (!lockPath) return EMPTY_HUB_LOCK_PROFILE;
  const raw = safeReadJson(lockPath);
  if (!raw || typeof raw !== "object") return EMPTY_HUB_LOCK_PROFILE;
  const lock = raw as Record<string, unknown>;
  const manifest = lock.manifest && typeof lock.manifest === "object" ? (lock.manifest as Record<string, unknown>) : {};
  const install = lock.install && typeof lock.install === "object" ? (lock.install as Record<string, unknown>) : {};
  const assets = Array.isArray(lock.assets) ? lock.assets.map((asset) => normalizeAsset(asset, resolvedRoot)) : [];
  const localChangedAssets = assets.filter(
    (asset) => asset.currentChecksum && asset.checksum && asset.currentChecksum !== asset.checksum,
  );
  const highRiskAssets = assets.filter((asset) => asset.riskLevel === "L3" || asset.riskLevel === "L4");

  return {
    detected: true,
    manifestId: asString(manifest.slug) || asString(manifest.id) || asString(lock.manifestId) || null,
    manifestVersion: asString(manifest.version) || asString(lock.manifestVersion) || null,
    manifestChecksum: asString(manifest.checksum) || asString(lock.manifestChecksum) || null,
    mode: asString(install.mode) || asString(lock.mode) || null,
    installedAt: asString(install.installedAt) || asString(lock.installedAt) || null,
    assetCount: assets.length,
    outdatedAssets: assets.filter((asset) => asset.status === "deprecated" || asset.version.includes("deprecated")),
    localChangedAssets,
    highRiskAssets,
    assets,
    sourcePath: lockPath,
  };
}

export function buildRuntimeReportFromHubLock(input: {
  projectName: string;
  repoUrl?: string | null;
  runId: string;
  stage: "requirement" | "design" | "implement" | "test" | "review" | "archive";
  status: "success" | "failed" | "partial";
  durationMs: number;
  failedReason?: string;
  profile: HubLockProfile;
}) {
  return {
    projectName: input.projectName,
    repoUrl: input.repoUrl || undefined,
    manifestId: input.profile.manifestId || undefined,
    manifestVersion: input.profile.manifestVersion || undefined,
    runId: input.runId,
    stage: input.stage,
    status: input.status,
    usedAssets: input.profile.assets.map((asset) => ({
      kind: asset.kind,
      assetId: asset.assetId,
      version: asset.version,
    })),
    durationMs: input.durationMs,
    failedReason: input.failedReason,
  };
}
