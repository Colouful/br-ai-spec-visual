import { formatRelativeTime } from "@/lib/view-models/formatters";
import { getStatusBadge } from "@/lib/view-models/status";
import type { MetricVm, StatusKey } from "@/lib/view-models/types";
import type { ChangeCardVm, ChangesPageVm } from "@/lib/view-models/changes";

export interface ChangeApiItem {
  id: string;
  changeKey: string;
  docType: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug?: string;
  summary: string;
  status: string;
  owner: string;
  reviewers: string[];
  systems: string[];
  runIds: string[];
  updatedAt: string;
  sourcePath: string;
}

export function mapChangeStatusKey(status: string | null | undefined): StatusKey {
  switch (status) {
    case "completed":
    case "success":
      return "approved";
    case "failed":
      return "blocked";
    case "merged":
      return "merged";
    case "draft":
      return "draft";
    default:
      return "review";
  }
}

export function buildChangeCardFromApiItem(
  item: ChangeApiItem,
  now: Date,
  timeZone: string,
): ChangeCardVm {
  return {
    id: item.id,
    title: item.title,
    workspaceId: item.workspaceId,
    workspaceName: item.workspaceName,
    workspaceSlug: item.workspaceSlug ?? item.workspaceId,
    summary: item.summary,
    status: getStatusBadge(mapChangeStatusKey(item.status)),
    owner: item.owner,
    risk: "medium",
    updatedAt: formatRelativeTime(item.updatedAt, { now, timeZone }),
    systems: item.systems,
    runIds: item.runIds,
  };
}

export function buildChangeColumns(cards: ChangeCardVm[]): ChangesPageVm["columns"] {
  return [
    { id: "review", label: "评审中" },
    { id: "approved", label: "已批准" },
    { id: "blocked", label: "已阻断" },
    { id: "draft", label: "草稿" },
    { id: "merged", label: "已合并" },
  ]
    .map((column) => ({
      ...column,
      cards: cards.filter((card) => card.status.label === column.label),
    }))
    .filter((column) => column.cards.length > 0);
}

export function buildChangeSignals(cards: ChangeCardVm[]): MetricVm[] {
  return [
    { label: "已跟踪文档", value: String(cards.length) },
    { label: "覆盖工作区", value: String(new Set(cards.map((card) => card.workspaceId)).size) },
    { label: "关联运行", value: String(cards.reduce((sum, card) => sum + card.runIds.length, 0)) },
  ];
}
