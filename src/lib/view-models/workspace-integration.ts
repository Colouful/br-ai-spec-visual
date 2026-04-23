import fs from "node:fs";
import path from "node:path";

import {
  calculateAssetCompletionScore,
  EMPTY_ASSET_SNAPSHOT,
  resolveOnboardingStage,
  toAssetChecks,
  type DashboardAssetCheckVm,
  type OnboardingStageVm,
  type WorkspaceAssetSnapshot,
} from "@/lib/view-models/dashboard-shared";

export interface WorkspaceOnboardingVm {
  workspaceName: string;
  workspaceRootPath: string | null;
  stage: OnboardingStageVm;
  nextAction: string;
  nextActionHint: string;
  score: number;
  assets: DashboardAssetCheckVm[];
}

function safeExists(targetPath: string) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

export function detectWorkspaceAssets(rootPath: string | null): WorkspaceAssetSnapshot {
  if (!rootPath) {
    return EMPTY_ASSET_SNAPSHOT;
  }

  try {
    const targetRoot = path.resolve(rootPath);
    return {
      hasRules: safeExists(path.join(targetRoot, ".agents", "rules")),
      hasSkills: safeExists(path.join(targetRoot, ".agents", "skills")),
      hasOpenSpec: safeExists(path.join(targetRoot, "openspec")),
      hasAiSpec: safeExists(path.join(targetRoot, ".ai-spec")),
      hasRegistry: safeExists(path.join(targetRoot, ".agents", "registry")),
      hasLogs:
        safeExists(path.join(targetRoot, ".ai-spec", "logs")) ||
        safeExists(path.join(targetRoot, ".ai-spec", "history")) ||
        safeExists(path.join(targetRoot, ".ai-spec", "internal")),
      hasVisualBridge: safeExists(
        path.join(targetRoot, ".ai-spec", "visual-bridge.json"),
      ),
    };
  } catch {
    return EMPTY_ASSET_SNAPSHOT;
  }
}

function resolveNextAction(stage: OnboardingStageVm) {
  switch (stage.key) {
    case "not-connected":
      return {
        label: "先完成 Base 初始化",
        hint: "在项目根目录执行 ai-spec-auto init，把 .agents / openspec / .ai-spec 注入进来。",
      };
    case "base-ready":
      return {
        label: "连接 Visual 与 Collector",
        hint: "执行 ai-spec-auto visual init，生成 .ai-spec/visual-bridge.json 并完成自检。",
      };
    case "visual-ready":
      return {
        label: "开始第一条真实需求",
        hint: "从 /spec-start 或 visual(可视化端) 主线入口发起一个真实变更，观察运行态是否上屏。",
      };
    case "run-ready":
      return {
        label: "完成一次归档闭环",
        hint: "补齐 archive-change(归档专家) 流程，让工作区首页出现闭环结果与归档记录。",
      };
    case "archived":
      return {
        label: "扩展接入与复盘",
        hint: "继续接入更多真实需求，观察阻塞点、归档率和安装趋势是否稳定。",
      };
  }
}

export function buildWorkspaceOnboardingVm(input: {
  workspaceName: string;
  rootPath: string | null;
  runCount: number;
  archiveCount: number;
}): WorkspaceOnboardingVm {
  const assets = detectWorkspaceAssets(input.rootPath);
  const stage = resolveOnboardingStage({
    assets,
    runCount: input.runCount,
    archiveCount: input.archiveCount,
  });
  const nextAction = resolveNextAction(stage);

  return {
    workspaceName: input.workspaceName,
    workspaceRootPath: input.rootPath,
    stage,
    nextAction: nextAction.label,
    nextActionHint: nextAction.hint,
    score: calculateAssetCompletionScore(assets),
    assets: toAssetChecks(assets),
  };
}
