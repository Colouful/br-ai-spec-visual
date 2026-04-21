import type { MetricVm } from "@/lib/view-models/types";
import type { RunCardVm } from "@/lib/view-models/runs";

export function isLiveRunCard(card: RunCardVm) {
  return card.statusKey === "running";
}

export function buildRunsWorkspaceIds(
  cards: RunCardVm[],
  seedWorkspaceIds: string[] = [],
): string[] {
  return [
    ...new Set([
      ...seedWorkspaceIds.filter(Boolean),
      ...cards.map((card) => card.workspaceId).filter(Boolean),
    ]),
  ];
}

export function buildRunsBuckets(cards: RunCardVm[]): {
  active: RunCardVm[];
  history: RunCardVm[];
  signals: MetricVm[];
} {
  const active = cards.filter((card) => ["running", "queued"].includes(card.statusKey));
  const history = cards.filter((card) => !active.includes(card));
  const failed = cards.filter((card) => card.statusKey === "failed");

  return {
    active,
    history,
    signals: [
      { label: "总运行数", value: String(cards.length) },
      { label: "活跃运行", value: String(active.length) },
      { label: "失败数", value: String(failed.length) },
    ],
  };
}
