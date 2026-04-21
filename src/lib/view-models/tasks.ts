import { listTaskReadModels } from "@/lib/services/read-model";
import { formatRelativeTime } from "@/lib/view-models/formatters";
import { getStatusBadge } from "@/lib/view-models/status";
import { mapChangeStatusKey } from "@/lib/view-models/changes-shared";
import { normalizeRunStatusKey } from "@/lib/view-models/run-status";
import type { PageHeroVm } from "@/lib/view-models/types";

export interface TaskRowVm {
  id: string;
  kindLabel: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  status: ReturnType<typeof getStatusBadge>;
  owner: string;
  updatedAt: string;
  summary: string;
  meta: string;
  linkHref: string;
}

export interface TasksPageVm {
  hero: PageHeroVm;
  rows: TaskRowVm[];
}

export async function getTasksPageVm(timeZone = "Asia/Shanghai"): Promise<TasksPageVm> {
  const tasks = await listTaskReadModels();
  const now = new Date();
  const rows = tasks.map((task) => ({
    id: task.id,
    kindLabel: task.kind === "run" ? "运行任务" : "变更任务",
    title: task.title,
    workspaceId: task.workspaceId,
    workspaceName: task.workspaceName,
    status: getStatusBadge(
      task.kind === "run"
        ? normalizeRunStatusKey(task.status)
        : mapChangeStatusKey(task.status),
    ),
    owner: task.owner,
    updatedAt: formatRelativeTime(task.updatedAt, { now, timeZone }),
    summary: task.summary,
    meta: task.meta,
    linkHref: task.linkHref,
  }));

  return {
    hero: {
      eyebrow: "执行看板",
      title: "按任务维度追踪运行与变更",
      subtitle: "这里把运行任务和变更任务按统一列表管理，方便直接进入详情和排查阻塞。",
      stats: [
        { label: "任务数", value: String(rows.length) },
        { label: "运行中", value: String(rows.filter((row) => row.status.label === "运行中").length) },
        { label: "已阻断", value: String(rows.filter((row) => row.status.label === "已阻断").length) },
      ],
    },
    rows,
  };
}
