import { describe, expect, it } from "vitest";

import type { RunCardVm } from "@/lib/view-models/runs";
import {
  buildRunsBuckets,
  buildRunsWorkspaceIds,
  isLiveRunCard,
} from "@/lib/view-models/runs-shared";

const baseCard: RunCardVm = {
  id: "run-1",
  title: "run",
  workspaceId: "workspace-demo",
  workspaceName: "工作区",
  summary: "summary",
  statusKey: "running",
  status: {
    label: "运行中",
    tone: "lime",
    pulse: true,
  },
  trigger: "runtime-state",
  startedAtIso: "2026-04-20T06:00:00.000Z",
  updatedAtIso: "2026-04-20T06:05:00.000Z",
  startedAt: "Apr 20, 14:00",
  updatedAt: "1m ago",
  duration: "5m",
  progressLabel: "70%",
  progressValue: 0.7,
  operator: "system",
};

describe("buildRunsBuckets", () => {
  it("splits active and history runs by localized status label", () => {
    const result = buildRunsBuckets([
      baseCard,
      {
        ...baseCard,
        id: "run-2",
        statusKey: "queued",
        status: {
          label: "排队中",
          tone: "sky",
          pulse: false,
        },
      },
      {
        ...baseCard,
        id: "run-3",
        statusKey: "failed",
        status: {
          label: "失败",
          tone: "rose",
          pulse: false,
        },
      },
    ]);

    expect(result.active.map((item) => item.id)).toEqual(["run-1", "run-2"]);
    expect(result.history.map((item) => item.id)).toEqual(["run-3"]);
  });

  it("computes signals from current cards", () => {
    const result = buildRunsBuckets([
      baseCard,
      {
        ...baseCard,
        id: "run-2",
        statusKey: "failed",
        status: {
          label: "失败",
          tone: "rose",
          pulse: false,
        },
      },
    ]);

    expect(result.signals).toEqual([
      { label: "总运行数", value: "2" },
      { label: "活跃运行", value: "1" },
      { label: "失败数", value: "1" },
    ]);
  });

  it("dedupes workspace ids while preserving seed subscriptions", () => {
    const result = buildRunsWorkspaceIds(
      [
        baseCard,
        {
          ...baseCard,
          id: "run-2",
          workspaceId: "workspace-b",
        },
      ],
      ["workspace-a", "workspace-seed", "workspace-a"],
    );

    expect(result).toEqual(["workspace-a", "workspace-seed", "workspace-demo", "workspace-b"]);
  });

  it("uses localized status labels to decide live clock visibility", () => {
    expect(isLiveRunCard(baseCard)).toBe(true);
    expect(
      isLiveRunCard({
        ...baseCard,
        statusKey: "queued",
        status: {
          label: "排队中",
          tone: "sky",
          pulse: false,
        },
      }),
    ).toBe(false);
    expect(
      isLiveRunCard({
        ...baseCard,
        statusKey: "completed",
        status: {
          label: "已完成",
          tone: "cyan",
          pulse: false,
        },
      }),
    ).toBe(false);
  });
});
