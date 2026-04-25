export type CollectorErrorCode =
  | "BAD_REQUEST"
  | "PRIVACY_POLICY_VIOLATED"
  | "INTERNAL_ERROR";

export type PrivacyFlags = {
  sourceCodeIncluded?: boolean;
  rawPromptIncluded?: boolean;
  rawResponseIncluded?: boolean;
  absolutePathIncluded?: boolean;
  userNameIncluded?: boolean;
};

export type VisualProjectRecord = {
  id: string;
  projectId: string;
  workspaceId?: string | null;
  projectHash?: string | null;
  name?: string | null;
  type: string;
  techProfile: Record<string, unknown>;
  manifest: Record<string, unknown>;
  packages: unknown[];
  lastRunId?: string | null;
  riskLevel?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VisualRunRecord = {
  id: string;
  runId: string;
  projectId: string;
  workspaceId?: string | null;
  requirementSummary?: string | null;
  state: string;
  stage: string;
  executor?: string | null;
  manifest: Record<string, unknown>;
  branch: Record<string, unknown>;
  worktree: Record<string, unknown>;
  contextSummary: Record<string, unknown>;
  verificationSummary: Record<string, unknown>;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type VisualRuntimeEventRecord = {
  id: string;
  eventId: string;
  runId: string;
  projectId: string;
  type: string;
  stage?: string | null;
  state?: string | null;
  level: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type VisualHistoryItemRecord = {
  id: string;
  historyId: string;
  runId?: string | null;
  projectId: string;
  title: string;
  summary: string;
  changedFiles: unknown[];
  assetsUsed: unknown[];
  verificationSummary: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type VisualIncidentRecord = {
  id: string;
  incidentId: string;
  runId: string;
  projectId: string;
  type: string;
  level: string;
  stage?: string | null;
  message: string;
  suggestion?: string | null;
  diagnoseResult: Record<string, unknown>;
  recoveryAction: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
};
