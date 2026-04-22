export const PRIMARY_DATA_SOURCE_KINDS = [
  "registry-json",
  "omx-jsonl",
] as const;

export const SECONDARY_DATA_SOURCE_KINDS = [
  "run-state-json",
  "openspec-json",
  "repo-map-json",
  "hook-event",
  "control-receipt",
] as const;

export type PrimaryDataSourceKind = (typeof PRIMARY_DATA_SOURCE_KINDS)[number];
export type SecondaryDataSourceKind =
  (typeof SECONDARY_DATA_SOURCE_KINDS)[number];
export type DataSourceKind =
  | PrimaryDataSourceKind
  | SecondaryDataSourceKind;

export interface DataSourceFileInput {
  sourcePath?: string;
  filePath?: string;
  content: string;
  workspaceId?: string;
}

export function isRegistrySourcePath(sourcePath: string) {
  return sourcePath.startsWith(".agents/registry/") && sourcePath.endsWith(".json");
}

export function isOmxJsonlSourcePath(sourcePath: string) {
  return sourcePath.startsWith(".omx/logs/") && sourcePath.endsWith(".jsonl");
}
