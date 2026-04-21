import { formatCompactNumber, formatNameList, formatPercent, formatRelativeTime } from "@/lib/view-models/formatters";
import { getStatusBadge } from "@/lib/view-models/status";
import type { MetricVm, StatusKey } from "@/lib/view-models/types";
import type { WorkspaceCardVm } from "@/lib/view-models/workspaces";

export interface WorkspaceApiItem {
  id: string;
  name: string;
  description: string;
  zone: string;
  health: StatusKey;
  owners: string[];
  projectCount: number;
  throughput: number;
  successRate: number;
  activeRuns: number;
  openChanges: number;
  lastActivityAt: string;
  focus: string;
  tags: string[];
}

export function buildWorkspaceHealthBands(statuses: StatusKey[]): MetricVm[] {
  return [
    { key: "healthy", label: "健康" },
    { key: "warning", label: "需关注" },
    { key: "critical", label: "严重" },
    { key: "idle", label: "空闲" },
  ].map((item) => ({
    label: item.label,
    value: String(statuses.filter((status) => status === item.key).length),
  }));
}

export function buildWorkspaceCardFromApiItem(
  item: WorkspaceApiItem,
  now: Date,
  timeZone: string,
): WorkspaceCardVm {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    zone: item.zone,
    badge: getStatusBadge(item.health),
    owners: formatNameList(item.owners),
    projectCount: String(item.projectCount),
    throughput: formatCompactNumber(item.throughput),
    successRate: formatPercent(item.successRate),
    activeRuns: item.activeRuns,
    openChanges: item.openChanges,
    lastActivity: formatRelativeTime(item.lastActivityAt, { now, timeZone }),
    focus: item.focus,
    tags: item.tags,
  };
}

