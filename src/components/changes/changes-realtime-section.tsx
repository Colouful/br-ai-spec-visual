"use client";

import { useCallback, useMemo, useState } from "react";

import { ChangesBoard } from "@/components/changes/changes-board";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import type { ChangesPageVm } from "@/lib/view-models/changes";
import {
  buildChangeCardFromApiItem,
  buildChangeColumns,
  buildChangeSignals,
  type ChangeApiItem,
} from "@/lib/view-models/changes-shared";

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

export function ChangesRealtimeSection({
  initialViewModel,
}: {
  initialViewModel: ChangesPageVm;
}) {
  const [viewModel, setViewModel] = useState(initialViewModel);
  const workspaceIds = useMemo(
    () => Array.from(new Set(viewModel.columns.flatMap((column) => column.cards.map((card) => card.workspaceId)))),
    [viewModel.columns],
  );

  const handleRealtimeEvent = useCallback(async (payload: unknown) => {
    const workspaceId = extractWorkspaceId(payload);
    if (!workspaceId) {
      return;
    }

    const response = await fetch(`/api/changes?workspace_id=${encodeURIComponent(workspaceId)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const body = await response.json();
    const items = Array.isArray(body.items) ? (body.items as ChangeApiItem[]) : [];
    if (items.length === 0) {
      return;
    }

    setViewModel((current) => {
      const now = new Date();
      const incomingCards = items.map((item) => buildChangeCardFromApiItem(item, now, "Asia/Shanghai"));
      const retainedCards = current.columns
        .flatMap((column) => column.cards)
        .filter((card) => card.workspaceId !== workspaceId);
      const nextCards = [...retainedCards, ...incomingCards].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
      const nextColumns = buildChangeColumns(nextCards);
      return {
        ...current,
        hero: {
          ...current.hero,
          stats: [
            { label: "文档数", value: String(nextCards.length) },
            { label: "评审中", value: String(nextColumns.find((item) => item.id === "review")?.cards.length ?? 0) },
            { label: "已阻断", value: String(nextColumns.find((item) => item.id === "blocked")?.cards.length ?? 0) },
          ],
        },
        columns: nextColumns,
        signals: buildChangeSignals(nextCards),
      };
    });
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <RealtimeWorkspaceBridge
          label="变更订阅"
          workspaceIds={workspaceIds}
          onEvent={handleRealtimeEvent}
        />
      </div>
      <ChangesBoard viewModel={viewModel} />
    </>
  );
}
