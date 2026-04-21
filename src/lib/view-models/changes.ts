import { getDemoConsoleData } from "@/lib/demo/console-data";
import { listChangeReadModels } from "@/lib/services/read-model";
import { getStatusBadge } from "@/lib/view-models/status";
import type { MetricVm, PageHeroVm, StatusKey } from "@/lib/view-models/types";
import { formatRelativeTime } from "@/lib/view-models/formatters";
import {
  buildChangeCardFromApiItem,
  buildChangeColumns,
  buildChangeSignals,
  mapChangeStatusKey,
} from "@/lib/view-models/changes-shared";
import { zh, zhPlain } from "@/lib/view-models/i18n-terms";

export interface ChangeCardVm {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  summary: string;
  status: ReturnType<typeof getStatusBadge>;
  owner: string;
  risk: string;
  updatedAt: string;
  systems: string[];
  runIds: string[];
}

export interface ChangesPageVm {
  hero: PageHeroVm;
  columns: Array<{
    id: string;
    label: string;
    cards: ChangeCardVm[];
  }>;
  signals: MetricVm[];
}

export interface ChangeDetailVm {
  hero: PageHeroVm;
  change: ChangeCardVm & {
    reviewers: string[];
    checklist: Array<{ label: string; filePath: string | null }>;
    timeline: Array<{
      id: string;
      label: string;
      at: string;
      note: string;
    }>;
    sourcePath: string | null;
  };
}

async function buildDemoChangeCard(changeId: string, timeZone: string): Promise<ChangeCardVm> {
  const data = await getDemoConsoleData();
  const demoChange = data.changes.find((item) => item.id === changeId);
  if (!demoChange) {
    throw new Error(`Change ${changeId} not found`);
  }
  const workspace = data.workspaces.find((item) => item.id === demoChange.workspaceId);

  return {
    id: demoChange.id,
    title: demoChange.title,
    workspaceId: demoChange.workspaceId,
    workspaceName: workspace?.name ?? demoChange.workspaceId,
    summary: demoChange.summary,
    status: getStatusBadge(demoChange.status),
    owner: demoChange.owner,
    risk: demoChange.risk,
    updatedAt: formatRelativeTime(demoChange.updatedAt, {
      now: new Date(data.now),
      timeZone,
    }),
    systems: demoChange.systems,
    runIds: demoChange.relatedRunIds,
  };
}

export async function getChangesPageVm(timeZone = "Asia/Shanghai"): Promise<ChangesPageVm> {
  const realChanges = await listChangeReadModels();
  if (realChanges.length > 0) {
    const cards: ChangeCardVm[] = realChanges.map((change) => ({
      id: change.id,
      title: change.title,
      workspaceId: change.workspaceId,
      workspaceName: change.workspaceName,
      summary: change.summary,
      status: getStatusBadge(mapChangeStatusKey(change.status)),
      owner: change.owner,
      risk: "medium",
      updatedAt: formatRelativeTime(change.updatedAt, { now: new Date(), timeZone }),
      systems: change.systems.filter((entry): entry is string => typeof entry === "string" && Boolean(entry)),
      runIds: change.runIds,
    }));

    const columns = buildChangeColumns(cards);

    return {
      hero: {
        eyebrow: "变更看板",
        title: "以看板为核心的变更控制",
        subtitle:
          "当前看板优先读取 change_documents(变更文档索引)；数据库没有真实文档时才退回演示数据。",
        stats: [
          { label: "文档数", value: String(cards.length) },
          { label: "评审中", value: String(columns.find((item) => item.id === "review")?.cards.length ?? 0) },
          { label: "已阻断", value: String(columns.find((item) => item.id === "blocked")?.cards.length ?? 0) },
        ],
      },
      columns,
      signals: buildChangeSignals(cards),
    };
  }

  const data = await getDemoConsoleData();
  const cards = await Promise.all(
    data.changes.map((change) => buildDemoChangeCard(change.id, timeZone)),
  );
  const columns = buildChangeColumns(cards);

  return {
    hero: {
      eyebrow: "变更看板",
      title: "以看板为核心的变更控制",
      subtitle:
          "把提案、审批、合入和阻塞用一张偏控制台的看板展开，适合后续直接接真实接口列表。",
      stats: [
        { label: "进行中", value: String(cards.filter((card) => card.status.label !== "已合并").length) },
        { label: "已阻断", value: String(cards.filter((card) => card.status.label === "已阻断").length) },
        { label: "关联运行", value: String(cards.reduce((sum, card) => sum + card.runIds.length, 0)) },
      ],
    },
    columns,
    signals: [
      { label: "高风险", value: String(cards.filter((card) => card.risk === "high").length) },
      { label: "等待评审", value: String(cards.filter((card) => card.status.label === "评审中").length) },
      { label: "今日已合并", value: String(cards.filter((card) => card.status.label === "已合并").length) },
    ],
  };
}

export async function getChangeDetailVm(
  changeId: string,
  timeZone = "Asia/Shanghai",
): Promise<ChangeDetailVm | null> {
  const realChanges = await listChangeReadModels();
  const normalizedId = changeId.replace(/:/g, "__");
  const current = realChanges.find(
    (change) => change.id === changeId || change.id === normalizedId,
  );
  if (current) {
    const docTypeZh = zh(current.docType, "doc");
    const statusZh = zh(current.status, "status");
    const summaryZh = `${zhPlain(current.docType, "doc")} → ${current.sourcePath}`;
    return {
      hero: {
        eyebrow: `${current.workspaceName}（工作区）`,
        title: current.title,
        subtitle: summaryZh,
        stats: [
          { label: "状态", value: statusZh },
          { label: "文档类型", value: docTypeZh },
          { label: "更新时间", value: formatRelativeTime(current.updatedAt, { now: new Date(), timeZone }) },
        ],
      },
      change: {
        id: current.id,
        title: current.title,
        workspaceId: current.workspaceId,
        workspaceName: current.workspaceName,
        summary: summaryZh,
        status: getStatusBadge(mapChangeStatusKey(current.status)),
        owner: zh(current.owner, "role"),
        risk: "medium",
        updatedAt: formatRelativeTime(current.updatedAt, { now: new Date(), timeZone }),
        systems: current.systems
          .filter((entry): entry is string => typeof entry === "string" && Boolean(entry))
          .map((entry) => zh(entry, "system")),
        runIds: current.runIds,
        reviewers: current.reviewers.map((entry) => zh(entry, "role")),
        checklist: [{ label: current.sourcePath, filePath: current.sourcePath }],
        timeline: [
          {
            id: current.id,
            label: docTypeZh,
            at: formatRelativeTime(current.updatedAt, { now: new Date(), timeZone }),
            note: summaryZh,
          },
        ],
        sourcePath: current.sourcePath,
      },
    };
  }

  const data = await getDemoConsoleData();
  const demoChange = data.changes.find((item) => item.id === changeId);
  if (!demoChange) {
    return null;
  }
  const card = await buildDemoChangeCard(demoChange.id, timeZone);

  return {
    hero: {
      eyebrow: card.workspaceName,
      title: card.title,
      subtitle: card.summary,
      stats: [
        { label: "状态", value: card.status.label },
        { label: "风险", value: card.risk },
        { label: "更新时间", value: card.updatedAt },
      ],
    },
    change: {
      ...card,
      reviewers: demoChange.reviewers,
      checklist: demoChange.checklist.map((item) => ({ label: item, filePath: null })),
      timeline: demoChange.timeline.map((item) => ({
        id: item.id,
        label: item.label,
        at: formatRelativeTime(item.at, { now: new Date(data.now), timeZone }),
        note: item.note,
      })),
      sourcePath: null,
    },
  };
}
