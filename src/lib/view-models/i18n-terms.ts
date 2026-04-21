const DOC_TYPE_ZH: Record<string, string> = {
  iterations: "迭代记录",
  iteration: "迭代记录",
  "prd-to-delivery": "从需求到交付",
  prd: "产品需求",
  proposal: "变更提案",
  design: "设计方案",
  tasks: "任务清单",
  spec: "规格说明",
  change: "变更",
  delivery: "交付记录",
  review: "评审记录",
  retrospective: "复盘",
};

const STATUS_ZH: Record<string, string> = {
  planned: "已规划",
  draft: "草稿",
  review: "评审中",
  reviewing: "评审中",
  approved: "已通过",
  merged: "已合并",
  blocked: "已阻断",
  in_progress: "进行中",
  "in-progress": "进行中",
  done: "已完成",
  archived: "已归档",
  cancelled: "已取消",
};

const ROLE_ZH: Record<string, string> = {
  "requirement-analyst": "需求分析师",
  "frontend-implementer": "前端实现者",
  "backend-implementer": "后端实现者",
  "code-guardian": "代码守护者",
  "product-manager": "产品经理",
  "tech-lead": "技术负责人",
  reviewer: "评审人",
  approver: "审批人",
  designer: "设计师",
  qa: "测试工程师",
  system: "系统",
};

const SYSTEM_ZH: Record<string, string> = {
  ...DOC_TYPE_ZH,
  "order-board": "订单看板",
  "superpowers-demo": "超能力演示",
};

function translate(map: Record<string, string>, raw: string): string | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return map[key] ?? null;
}

/**
 * 将英文词汇转为中文；若无映射，返回原文 + 提示后缀，方便用户辨识。
 */
export function zh(raw: string | undefined | null, kind: "doc" | "status" | "role" | "system" | "generic" = "generic"): string {
  if (!raw) return "";
  const map =
    kind === "doc"
      ? DOC_TYPE_ZH
      : kind === "status"
        ? STATUS_ZH
        : kind === "role"
          ? ROLE_ZH
          : kind === "system"
            ? SYSTEM_ZH
            : { ...DOC_TYPE_ZH, ...STATUS_ZH, ...ROLE_ZH, ...SYSTEM_ZH };
  const hit = translate(map, raw);
  if (hit) return `${hit}（${raw}）`;
  return raw;
}

/**
 * 仅返回中文主体（没有匹配时返回原文，不附注），用于已知是中文的字段。
 */
export function zhPlain(raw: string | undefined | null, kind: Parameters<typeof zh>[1] = "generic"): string {
  if (!raw) return "";
  const map =
    kind === "doc"
      ? DOC_TYPE_ZH
      : kind === "status"
        ? STATUS_ZH
        : kind === "role"
          ? ROLE_ZH
          : kind === "system"
            ? SYSTEM_ZH
            : { ...DOC_TYPE_ZH, ...STATUS_ZH, ...ROLE_ZH, ...SYSTEM_ZH };
  return translate(map, raw) ?? raw;
}
