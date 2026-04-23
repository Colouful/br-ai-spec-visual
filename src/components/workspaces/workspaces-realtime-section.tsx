"use client";

import { useCallback, useState } from "react";

import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { WorkspacesOverview } from "@/components/workspaces/workspaces-overview";
import type { WorkspacesPageVm } from "@/lib/view-models/workspaces";
import {
  buildWorkspaceCardFromApiItem,
  buildWorkspaceHealthBands,
  buildWorkspaceOnboardingBands,
  type WorkspaceApiItem,
} from "@/lib/view-models/workspaces-shared";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: Record<string, unknown>, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : "";
}

function extractWorkspaceId(payload: unknown) {
  const record = asRecord(payload);
  return (
    readString(record, "workspace_id") ||
    readString(asRecord(record.payload), "workspace_id") ||
    readString(asRecord(asRecord(record.payload).envelope), "workspace_id")
  );
}

export function WorkspacesRealtimeSection({
  initialViewModel,
}: {
  initialViewModel: WorkspacesPageVm;
}) {
  const [viewModel, setViewModel] = useState(initialViewModel);

  const handleRealtimeEvent = useCallback(async (payload: unknown) => {
    const workspaceId = extractWorkspaceId(payload);
    if (!workspaceId) {
      return;
    }

    const response = await fetch(`/api/workspaces?workspace_id=${encodeURIComponent(workspaceId)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const body = await response.json();
    const item = Array.isArray(body.items) ? (body.items[0] as WorkspaceApiItem | undefined) : undefined;
    if (!item) {
      return;
    }

    setViewModel((current) => {
      const now = new Date();
      const nextCard = buildWorkspaceCardFromApiItem(item, now, "Asia/Shanghai");
      const existing = current.workspaces.find((workspace) => workspace.id === nextCard.id);
      const nextWorkspaces = existing
        ? current.workspaces.map((workspace) => (workspace.id === nextCard.id ? nextCard : workspace))
        : [nextCard, ...current.workspaces];
      return {
        ...current,
        hero: {
          ...current.hero,
          stats: [
            { label: "工作区", value: String(nextWorkspaces.length) },
            { label: "活跃运行", value: String(nextWorkspaces.reduce((sum, row) => sum + row.activeRuns, 0)) },
            { label: "进行中变更", value: String(nextWorkspaces.reduce((sum, row) => sum + row.openChanges, 0)) },
          ],
        },
        healthBands: buildWorkspaceHealthBands(nextWorkspaces.map((workspace) => workspace.badge.label === "健康"
          ? "healthy"
          : workspace.badge.label === "需关注"
            ? "warning"
            : workspace.badge.label === "严重"
              ? "critical"
              : "idle")),
        onboardingBands: buildWorkspaceOnboardingBands(
          nextWorkspaces.map((workspace) => workspace.onboardingStageKey),
        ),
        workspaces: nextWorkspaces,
      };
    });
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <RealtimeWorkspaceBridge
          label="工作区订阅"
          workspaceIds={viewModel.workspaces.map((workspace) => workspace.id)}
          onEvent={handleRealtimeEvent}
        />
      </div>
      <WorkspacesOverview viewModel={viewModel} />
    </>
  );
}
