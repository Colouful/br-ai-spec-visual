export type RouteDecisionType =
  | "quick-fix"
  | "patch"
  | "scope-delta"
  | "archive-fix"
  | "followup-patch"
  | "full-change"
  | "waiting-confirm";

export type RouteDecisionFlow =
  | "bugfix-to-verification"
  | "prd-to-delivery";

export type RouteDecisionTraceMode =
  | "direct-fix"
  | "same-change"
  | "followup-change"
  | "full-openspec";

export type RouteDecisionChangeContext =
  | "no-change"
  | "active-run"
  | "open-change"
  | "before-archive"
  | "archived-change";

export type RouteDecisionExpert =
  | "frontend-implementer"
  | "requirement-analyst"
  | "code-guardian"
  | "task-orchestrator";

export interface RouteDecisionInput {
  workspaceName: string;
  changeContext: RouteDecisionChangeContext;
  activeRunCount: number;
  openChangeCount: number;
  archivedChangeCount: number;
  hasExplicitTargetChange: boolean;
  lowRisk: boolean;
  styleOrCopyOnly: boolean;
  createPageOrMock: boolean;
  addsApi: boolean;
  addsRoute: boolean;
  addsStore: boolean;
  crossModule: boolean;
  requiresTrace: boolean;
  changesScope: boolean;
  reviewConclusionChanged: boolean;
  securityOrCompliance: boolean;
}

export interface RouteDecisionResult {
  routeDecision: RouteDecisionType;
  selectedFlow: RouteDecisionFlow | null;
  traceMode: RouteDecisionTraceMode | null;
  enterOpenSpec: boolean;
  nextExpert: RouteDecisionExpert | null;
  changeImpact: string | null;
  reconcileStrategy: string | null;
  recommendedCommand: string;
  exampleInput: string;
  traceLocation: string;
  reasons: string[];
  warnings: string[];
  summary: string;
}

function buildWarnings(input: RouteDecisionInput) {
  const warnings: string[] = [];

  if (input.changeContext === "open-change" && input.openChangeCount > 1 && !input.hasExplicitTargetChange) {
    warnings.push(`当前工作区存在 ${input.openChangeCount} 个未归档 change(变更)，需要先明确本次复用哪一个。`);
  }
  if (input.changeContext === "archived-change" && input.archivedChangeCount === 0) {
    warnings.push("当前工作区未检测到已归档 change(变更)，如果只是历史补修，请先确认目标归档记录。");
  }
  if (input.changeContext === "before-archive" && input.activeRunCount === 0) {
    warnings.push("当前工作区没有明显活跃 run(运行)，如果这是归档前修正，请确认实际门禁上下文仍然存在。");
  }

  return warnings;
}

function shouldUpgradeFromQuickFix(input: RouteDecisionInput) {
  return (
    input.createPageOrMock ||
    input.addsApi ||
    input.addsRoute ||
    input.addsStore ||
    input.crossModule ||
    input.requiresTrace ||
    input.changesScope ||
    input.securityOrCompliance
  );
}

function isQuickFixEligible(input: RouteDecisionInput) {
  return input.lowRisk && !shouldUpgradeFromQuickFix(input);
}

function summarizeReasons(input: RouteDecisionInput, base: string[]) {
  const reasons = [...base];

  if (input.styleOrCopyOnly) {
    reasons.push("输入偏向样式 / 文案 / 轻交互修正，更接近小修正语义。");
  }
  if (input.createPageOrMock) {
    reasons.push("命中新建页面 / mock 页面边界，不再适合轻量快修。");
  }
  if (input.addsApi || input.addsRoute || input.addsStore) {
    reasons.push("涉及 API / 路由 / store(状态管理) 等结构变化，应升级到完整链路。");
  }
  if (input.crossModule) {
    reasons.push("涉及跨模块联动，风险已经超出最小补丁。");
  }
  if (input.requiresTrace) {
    reasons.push("输入明确要求长期留痕 / 归档 / spec(规范文档)，应进入 OpenSpec 主链。");
  }
  if (input.changesScope) {
    reasons.push("输入会影响范围 / 接口 / 验收口径，需要回需求阶段增量修订。");
  }
  if (input.reviewConclusionChanged) {
    reasons.push("本次修正直接影响评审结论或归档前判断。");
  }
  if (input.securityOrCompliance) {
    reasons.push("命中权限 / 合规 / 风控等高风险边界，不能按轻量修正处理。");
  }

  return reasons;
}

function buildResult(
  routeDecision: RouteDecisionType,
  selectedFlow: RouteDecisionFlow | null,
  traceMode: RouteDecisionTraceMode | null,
  nextExpert: RouteDecisionExpert | null,
  enterOpenSpec: boolean,
  reasons: string[],
  warnings: string[],
): RouteDecisionResult {
  switch (routeDecision) {
    case "quick-fix":
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: null,
        reconcileStrategy: null,
        recommendedCommand: "自然语言直接描述",
        exampleInput: "把列表标题文案改一下，按钮也更简洁一点",
        traceLocation: ".ai-spec/history/<run-id>/",
        reasons,
        warnings,
        summary: "适合作为全新、低风险、小范围小修正进入轻量链路。",
      };
    case "patch":
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: "patch",
        reconcileStrategy: "in-place",
        recommendedCommand: "/spec-update <修正说明>",
        exampleInput: "这个列表页标题改短一点，按钮颜色再轻一点",
        traceLocation: "当前 run(运行) + 当前 open change(未归档变更)",
        reasons,
        warnings,
        summary: "属于当前 change(变更) 内的小修正，按最小 diff(最小改动) 吸收即可。",
      };
    case "scope-delta":
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: "scope-delta",
        reconcileStrategy: "rewind-to-requirement",
        recommendedCommand: "/spec-update <范围变化说明>",
        exampleInput: "这个变更再补一个接口字段调整，并改一下验收口径",
        traceLocation: "当前 open change(未归档变更)",
        reasons,
        warnings,
        summary: "输入已经影响范围 / 接口 / 验收边界，需要回 requirement-analyst(需求解析专家)。",
      };
    case "archive-fix":
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: "archive-fix",
        reconcileStrategy:
          nextExpert === "requirement-analyst"
            ? "rewind-to-requirement"
            : nextExpert === "code-guardian"
              ? "rewind-to-guardian"
              : "rewind-to-frontend",
        recommendedCommand: "自然语言：先别归档，这里改成...",
        exampleInput: "先别归档，这个实现不对，改成卡片布局",
        traceLocation: "当前 change(变更) 内回退修正",
        reasons,
        warnings,
        summary: "归档前发现问题，应先修正再归档，不进入 archive fast-path(归档快速收口)。",
      };
    case "followup-patch":
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: "followup-patch",
        reconcileStrategy: "followup-patch",
        recommendedCommand: "自然语言：给上个归档变更补个修正...",
        exampleInput: "给上个归档变更补一个修正，补一条关键回归测试",
        traceLocation: "新 patch change(补丁变更) + parent_change_id(父变更标识)",
        reasons,
        warnings,
        summary: "原变更已归档，当前修正应新开补丁 change(变更) 而不是直接改 archive(归档结果)。",
      };
    case "full-change":
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: "re-scope",
        reconcileStrategy: "suggest-new-change",
        recommendedCommand: "/spec-start <需求描述>",
        exampleInput: "创建一个商品详情 mock 页面，只做演示版，数据本地 mock",
        traceLocation: "openspec/changes/<change-id>/",
        reasons,
        warnings,
        summary: "当前输入已经超出低风险快修边界，应进入完整 OpenSpec 主流程。",
      };
    case "waiting-confirm":
    default:
      return {
        routeDecision,
        selectedFlow,
        traceMode,
        enterOpenSpec,
        nextExpert,
        changeImpact: null,
        reconcileStrategy: null,
        recommendedCommand: "先明确本次要复用哪个 change_id(变更标识)",
        exampleInput: "请选择目标未归档 change 后再继续 patch(补丁修正) / scope-delta(范围增量)。",
        traceLocation: "等待明确目标 change(变更)",
        reasons,
        warnings,
        summary: "系统不应该在多个未归档 change 并存时替你猜测目标变更。",
      };
  }
}

export function evaluateRouteDecision(
  input: RouteDecisionInput,
): RouteDecisionResult {
  const warnings = buildWarnings(input);

  if (
    input.changeContext === "open-change" &&
    input.openChangeCount > 1 &&
    !input.hasExplicitTargetChange
  ) {
    return buildResult(
      "waiting-confirm",
      null,
      null,
      null,
      true,
      summarizeReasons(input, ["当前存在多个 open change(未归档变更)，不能自动猜测复用目标。"]),
      warnings,
    );
  }

  if (input.changeContext === "before-archive") {
    const nextExpert = input.reviewConclusionChanged
      ? "code-guardian"
      : input.changesScope
        ? "requirement-analyst"
        : "frontend-implementer";

    return buildResult(
      "archive-fix",
      "prd-to-delivery",
      "same-change",
      nextExpert,
      true,
      summarizeReasons(input, ["当前属于归档前修正场景，应先处理问题再放行归档。"]),
      warnings,
    );
  }

  if (input.changeContext === "archived-change") {
    return buildResult(
      "followup-patch",
      "prd-to-delivery",
      "followup-change",
      input.changesScope ? "requirement-analyst" : "frontend-implementer",
      true,
      summarizeReasons(input, ["当前是在已归档内容上继续补修，应新开 followup-patch(归档后补丁)。"]),
      warnings,
    );
  }

  if (input.changeContext === "open-change" || input.changeContext === "active-run") {
    if (input.changesScope || input.requiresTrace) {
      return buildResult(
        "scope-delta",
        "prd-to-delivery",
        "same-change",
        "requirement-analyst",
        true,
        summarizeReasons(input, ["当前输入会改变既有 change(变更) 的范围或留痕要求，需要回需求阶段。"]),
        warnings,
      );
    }

    return buildResult(
      "patch",
      "prd-to-delivery",
      "same-change",
      "frontend-implementer",
      true,
      summarizeReasons(input, ["当前修正仍然落在同一条 change(变更) 内，可以按 patch(补丁修正) 最小吸收。"]),
      warnings,
    );
  }

  if (isQuickFixEligible(input)) {
    return buildResult(
      "quick-fix",
      "bugfix-to-verification",
      "direct-fix",
      "frontend-implementer",
      false,
      summarizeReasons(input, ["这是全新且低风险的小修正，更适合走轻量 bugfix-to-verification(缺陷修复到验证流程)。"]),
      warnings,
    );
  }

  return buildResult(
    "full-change",
    "prd-to-delivery",
    "full-openspec",
    null,
    true,
    summarizeReasons(input, ["当前输入已经超出 quick-fix(轻量快修) 边界，需要进入完整交付链。"]),
    warnings,
  );
}
