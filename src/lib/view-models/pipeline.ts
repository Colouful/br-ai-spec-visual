export type PipelineStageId =
  | "spec"
  | "plan"
  | "run"
  | "review"
  | "archive";

export const PIPELINE_STAGE_ORDER: PipelineStageId[] = [
  "spec",
  "plan",
  "run",
  "review",
  "archive",
];

export interface PipelineStageMeta {
  id: PipelineStageId;
  title: string;
  description: string;
  accent: string;
}

export const PIPELINE_STAGE_META: Record<PipelineStageId, PipelineStageMeta> = {
  spec: {
    id: "spec",
    title: "Spec",
    description: "提案、设计与规范文档",
    accent: "from-cyan-300/30 to-sky-700/30",
  },
  plan: {
    id: "plan",
    title: "Plan",
    description: "任务拆解与待执行计划",
    accent: "from-indigo-300/30 to-blue-700/30",
  },
  run: {
    id: "run",
    title: "Run",
    description: "正在执行的运行实例",
    accent: "from-amber-300/30 to-orange-700/30",
  },
  review: {
    id: "review",
    title: "Review",
    description: "守门评审 / 等待审批",
    accent: "from-fuchsia-300/30 to-purple-700/30",
  },
  archive: {
    id: "archive",
    title: "Archive",
    description: "已合并 / 完成 / 归档",
    accent: "from-emerald-300/30 to-teal-700/30",
  },
};

export type PipelineEntity =
  | {
      kind: "run";
      status: string | null;
      lastEventType: string;
      pendingGate: string | null;
      currentRole: string | null;
    }
  | {
      kind: "change";
      docType: string;
      status: string | null;
      archivedAt: Date | null;
    };

/**
 * 单一收敛点：把任意业务实体（RunState / ChangeDocument）映射到 5 阶段。
 *
 * 规则优先级（从上到下）：
 *  1. 已归档 / completed / merged → archive
 *  2. 等待守门 / awaiting_review / 有 pendingGate → review
 *  3. RunState 在 running / 任意活跃 lastEventType → run
 *  4. RunState 在 queued/planned/observed → plan
 *  5. ChangeDocument docType=tasks → plan
 *  6. ChangeDocument docType=proposal/design/spec → spec
 *  7. 其他 → spec（默认起点）
 */
export function toPipelineStage(entity: PipelineEntity): PipelineStageId {
  if (entity.kind === "run") {
    const status = (entity.status ?? "").toLowerCase();
    const event = (entity.lastEventType ?? "").toLowerCase();
    const gate = (entity.pendingGate ?? "").toLowerCase();

    if (
      status === "completed" ||
      status === "success" ||
      status === "archived" ||
      event.includes("archived") ||
      event.includes("run.completed")
    ) {
      return "archive";
    }
    if (
      gate ||
      status === "awaiting_review" ||
      status === "review" ||
      event.includes("gate") ||
      event.includes("review")
    ) {
      return "review";
    }
    if (status === "queued" || status === "planned" || status === "observed") {
      return "plan";
    }
    return "run";
  }

  const docType = (entity.docType ?? "").toLowerCase();
  const status = (entity.status ?? "").toLowerCase();

  if (entity.archivedAt || status === "archived" || status === "merged") {
    return "archive";
  }
  if (status === "review" || status === "guardian" || status === "awaiting_review") {
    return "review";
  }
  if (status === "running" || status === "implementation") {
    return "run";
  }
  if (docType.includes("task") || status === "queued" || status === "planned") {
    return "plan";
  }
  if (
    docType.includes("proposal") ||
    docType.includes("design") ||
    docType.includes("spec") ||
    docType.includes("delta")
  ) {
    return "spec";
  }
  return "spec";
}

export type PipelineCardKind = "run" | "change";

/**
 * 无终态的 run 在 Pipeline 看板中「长期停留在 Run 列」时，超过该时长后从看板**隐藏**（不删库，运行列表仍可查）。
 * 通过环境变量 `PIPELINE_STALE_RUN_MAX_AGE_HOURS` 覆盖，默认 24 小时。单位：小时。
 */
export const DEFAULT_PIPELINE_STALE_RUN_MAX_AGE_HOURS = 24;

export function getPipelineStaleRunMaxAgeMs(): number {
  if (typeof process === "undefined" || !process.env) {
    return DEFAULT_PIPELINE_STALE_RUN_MAX_AGE_HOURS * 60 * 60 * 1000;
  }
  const raw = process.env.PIPELINE_STALE_RUN_MAX_AGE_HOURS;
  const h = raw ? Number.parseFloat(raw) : DEFAULT_PIPELINE_STALE_RUN_MAX_AGE_HOURS;
  if (!Number.isFinite(h) || h <= 0) {
    return DEFAULT_PIPELINE_STALE_RUN_MAX_AGE_HOURS * 60 * 60 * 1000;
  }
  return h * 60 * 60 * 1000;
}

/**
 * 仅当卡片为 run 且阶段为 Run 列、且最后活动时间早于 now−maxAge 时，从看板隐去。
 * 不替代 `run.archived` / 完成态事件；只缓解历史脏数据。
 */
export function shouldHideStaleRunFromPipeline(
  input: {
    kind: PipelineCardKind;
    stage: PipelineStageId;
    lastOccurredAt: Date;
    now: Date;
  },
  maxAgeMs: number = getPipelineStaleRunMaxAgeMs(),
): boolean {
  if (input.kind !== "run" || input.stage !== "run") {
    return false;
  }
  return input.now.getTime() - input.lastOccurredAt.getTime() > maxAgeMs;
}

export interface PipelineCardVm {
  id: string;
  kind: PipelineCardKind;
  stage: PipelineStageId;
  title: string;
  subtitle: string;
  status: string;
  changeKey: string | null;
  runKey: string | null;
  ownerRole: string | null;
  pendingGate: string | null;
  lastActivityRelative: string;
  lastActivityIso: string;
  href: string;
}

export interface PipelineColumnVm extends PipelineStageMeta {
  cards: PipelineCardVm[];
}

export interface WorkspacePipelineVm {
  workspaceId: string;
  workspaceSlug: string;
  columns: PipelineColumnVm[];
  totalCards: number;
  totalArchive: number;
  pendingReview: number;
  activeRun: number;
  /** 因超时被隐藏、仍存于库中的 run（仅 Pipeline 看板不列；运行页仍可查） */
  hiddenStaleRuns: number;
}

export interface PipelineDistribution {
  stage: PipelineStageId;
  title: string;
  count: number;
}

export function toStageDistribution(vm: WorkspacePipelineVm): PipelineDistribution[] {
  return vm.columns.map((column) => ({
    stage: column.id,
    title: column.title,
    count: column.cards.length,
  }));
}

export function buildPipelineColumns(cards: PipelineCardVm[]): PipelineColumnVm[] {
  return PIPELINE_STAGE_ORDER.map((id) => ({
    ...PIPELINE_STAGE_META[id],
    cards: cards
      .filter((card) => card.stage === id)
      .sort((left, right) =>
        right.lastActivityIso.localeCompare(left.lastActivityIso),
      ),
  }));
}
