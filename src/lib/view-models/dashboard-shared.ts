export const ONBOARDING_STAGE_ORDER = [
  "not-connected",
  "base-ready",
  "visual-ready",
  "run-ready",
  "archived",
] as const;

export type OnboardingStageKey = (typeof ONBOARDING_STAGE_ORDER)[number];

export interface WorkspaceAssetSnapshot {
  hasRules: boolean;
  hasSkills: boolean;
  hasOpenSpec: boolean;
  hasAiSpec: boolean;
  hasRegistry: boolean;
  hasHubLock: boolean;
  hasLogs: boolean;
  hasVisualBridge: boolean;
}

export interface OnboardingStageVm {
  key: OnboardingStageKey;
  label: string;
  detail: string;
}

export interface DashboardAssetCheckVm {
  key: keyof WorkspaceAssetSnapshot;
  label: string;
  detected: boolean;
}

export const EMPTY_ASSET_SNAPSHOT: WorkspaceAssetSnapshot = {
  hasRules: false,
  hasSkills: false,
  hasOpenSpec: false,
  hasAiSpec: false,
  hasRegistry: false,
  hasHubLock: false,
  hasLogs: false,
  hasVisualBridge: false,
};

export const ASSET_LABELS: Array<{
  key: keyof WorkspaceAssetSnapshot;
  label: string;
}> = [
  { key: "hasRules", label: "规则" },
  { key: "hasSkills", label: "技能" },
  { key: "hasOpenSpec", label: "OpenSpec" },
  { key: "hasAiSpec", label: ".ai-spec" },
  { key: "hasRegistry", label: "registry" },
  { key: "hasHubLock", label: "Hub Lock" },
  { key: "hasLogs", label: "logs" },
  { key: "hasVisualBridge", label: "Visual Bridge" },
];

function hasBaseAssets(snapshot: WorkspaceAssetSnapshot) {
  return (
    snapshot.hasRules ||
    snapshot.hasSkills ||
    snapshot.hasOpenSpec ||
    snapshot.hasAiSpec
  );
}

export function calculateAssetCompletionScore(snapshot: WorkspaceAssetSnapshot) {
  const total = ASSET_LABELS.length;
  const hit = ASSET_LABELS.filter(({ key }) => snapshot[key]).length;
  return Math.round((hit / total) * 100);
}

export function resolveOnboardingStage(input: {
  assets: WorkspaceAssetSnapshot;
  runCount: number;
  archiveCount: number;
}): OnboardingStageVm {
  if (input.archiveCount > 0) {
    return {
      key: "archived",
      label: "已归档",
      detail: "已经形成至少一次真实需求的归档闭环。",
    };
  }

  if (input.runCount > 0) {
    return {
      key: "run-ready",
      label: "已跑通需求",
      detail: "运行态已写入 Visual，可继续把闭环补到归档。",
    };
  }

  if (input.assets.hasVisualBridge) {
    return {
      key: "visual-ready",
      label: "已联通 Visual",
      detail: "桥接与运行态上报已准备好，可以直接发起第一个真实需求。",
    };
  }

  if (hasBaseAssets(input.assets)) {
    return {
      key: "base-ready",
      label: "已接入",
      detail: "项目规范底座已注入，但还没有把 Visual 联起来。",
    };
  }

  return {
    key: "not-connected",
    label: "未接入",
    detail: "还没有检测到 Base 侧规范资产，建议先完成 init。",
  };
}

export function resolveBlockerReason(input: {
  pendingGate: string | null;
  lastEventType: string;
  status: string;
}) {
  if (input.pendingGate) {
    return `等待门禁放行：${input.pendingGate}`;
  }

  const status = String(input.status || "").toLowerCase();
  const event = String(input.lastEventType || "").toLowerCase();

  if (status === "failed" || event.includes("failed")) {
    return "运行失败，等待人工处理";
  }

  if (event.includes("gate") || event.includes("review")) {
    return "正在等待评审结果";
  }

  if (event.includes("pause") || event.includes("blocked")) {
    return "执行被暂停，等待下一步动作";
  }

  return "等待下一步推进";
}

export function toAssetChecks(
  snapshot: WorkspaceAssetSnapshot,
): DashboardAssetCheckVm[] {
  return ASSET_LABELS.map(({ key, label }) => ({
    key,
    label,
    detected: snapshot[key],
  }));
}
