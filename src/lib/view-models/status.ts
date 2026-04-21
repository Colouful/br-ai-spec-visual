import type { StatusKey } from "@/lib/view-models/types";

export type StatusTone = "slate" | "sky" | "lime" | "amber" | "rose" | "cyan";

export interface StatusBadge {
  label: string;
  tone: StatusTone;
  pulse: boolean;
}

const STATUS_BADGES: Record<StatusKey, StatusBadge> = {
  healthy: {
    label: "健康",
    tone: "cyan",
    pulse: false,
  },
  warning: {
    label: "需关注",
    tone: "amber",
    pulse: false,
  },
  critical: {
    label: "严重",
    tone: "rose",
    pulse: true,
  },
  idle: {
    label: "空闲",
    tone: "slate",
    pulse: false,
  },
  queued: {
    label: "排队中",
    tone: "sky",
    pulse: false,
  },
  running: {
    label: "运行中",
    tone: "lime",
    pulse: true,
  },
  completed: {
    label: "已完成",
    tone: "cyan",
    pulse: false,
  },
  failed: {
    label: "失败",
    tone: "rose",
    pulse: false,
  },
  canceled: {
    label: "已取消",
    tone: "slate",
    pulse: false,
  },
  draft: {
    label: "草稿",
    tone: "slate",
    pulse: false,
  },
  review: {
    label: "评审中",
    tone: "amber",
    pulse: false,
  },
  approved: {
    label: "已批准",
    tone: "cyan",
    pulse: false,
  },
  merged: {
    label: "已合并",
    tone: "lime",
    pulse: false,
  },
  blocked: {
    label: "已阻断",
    tone: "rose",
    pulse: false,
  },
};

export function getStatusBadge(status: StatusKey): StatusBadge {
  return STATUS_BADGES[status];
}
