import { listSpecReadModels } from "@/lib/services/read-model";
import { formatRelativeTime } from "@/lib/view-models/formatters";
import { getStatusBadge } from "@/lib/view-models/status";
import { mapChangeStatusKey } from "@/lib/view-models/changes-shared";
import type { PageHeroVm } from "@/lib/view-models/types";

export interface SpecRowVm {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  docType: string;
  status: ReturnType<typeof getStatusBadge>;
  owner: string;
  sourcePath: string;
  updatedAt: string;
  summary: string;
}

export interface SpecsPageVm {
  hero: PageHeroVm;
  rows: SpecRowVm[];
}

export async function getSpecsPageVm(timeZone = "Asia/Shanghai"): Promise<SpecsPageVm> {
  const specs = await listSpecReadModels();
  const now = new Date();
  const rows = specs.map((spec) => ({
    id: spec.id,
    title: spec.title,
    workspaceId: spec.workspaceId,
    workspaceName: spec.workspaceName,
    docType: spec.docType,
    status: getStatusBadge(mapChangeStatusKey(spec.status)),
    owner: spec.owner,
    sourcePath: spec.sourcePath,
    updatedAt: formatRelativeTime(spec.updatedAt, { now, timeZone }),
    summary: spec.summary,
  }));

  return {
    hero: {
      eyebrow: "规范资产",
      title: "按文档维度管理规范资产",
      subtitle: "这里把 proposal、tasks、design 等文档按工作区和状态展开，方便集中治理。",
      stats: [
        { label: "文档数", value: String(rows.length) },
        { label: "工作区", value: String(new Set(rows.map((row) => row.workspaceName)).size) },
        { label: "评审中", value: String(rows.filter((row) => row.status.label === "评审中").length) },
      ],
    },
    rows,
  };
}
