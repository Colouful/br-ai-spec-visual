"use client";

import { useCallback, useEffect, useState } from "react";

import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { RunsTimeline } from "@/components/runs/runs-timeline";
import { formatDuration, formatRelativeTime, formatTimestamp } from "@/lib/view-models/formatters";
import { normalizeRunStatusKey } from "@/lib/view-models/run-status";
import type { RunsPageVm } from "@/lib/view-models/runs";
import { buildRunsBuckets, buildRunsWorkspaceIds } from "@/lib/view-models/runs-shared";
import { getStatusBadge } from "@/lib/view-models/status";

interface RunsApiItem {
  id: string;
  workspaceId: string;
  workspaceName: string;
  title: string;
  summary: string;
  status: string;
  trigger: string;
  lastOccurredAt: string;
  operator: string;
  changeId?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: Record<string, unknown>, key: string) {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : "";
}

function readObject(value: Record<string, unknown>, key: string) {
  return asRecord(value[key]);
}

function extractRunEventPatch(payload: unknown) {
  const envelope = asRecord(payload);
  const outerPayload = readObject(envelope, "payload");
  const nestedEnvelope = readObject(outerPayload, "envelope");
  const eventPayload = readObject(nestedEnvelope, "payload");
  const source = Object.keys(eventPayload).length > 0 ? eventPayload : outerPayload;
  const fallbackSource = Object.keys(source).length > 0 ? source : envelope;

  const runId =
    readString(source, "run_id") ||
    readString(outerPayload, "run_id") ||
    readString(fallbackSource, "run_id");
  if (!runId) {
    return null;
  }

  const status = readString(source, "status") || readString(outerPayload, "status");
  const currentRole = readString(source, "current_role") || readString(outerPayload, "current_role");
  const pendingGate = readString(source, "pending_gate") || readString(outerPayload, "pending_gate");
  const title = readString(source, "title") || readString(outerPayload, "title");
  const summary = readString(source, "summary") || readString(outerPayload, "summary");
  const updatedAt =
    readString(source, "updated_at") ||
    readString(source, "occurred_at") ||
    readString(outerPayload, "updated_at") ||
    readString(outerPayload, "occurred_at") ||
    new Date().toISOString();

  return {
    runId,
    status,
    currentRole,
    pendingGate,
    title,
    summary,
    updatedAt,
  };
}

function mapApiRunToCard(
  item: RunsApiItem,
  previousCard?: RunsPageVm["active"][number],
): RunsPageVm["active"][number] {
  const statusKey = normalizeRunStatusKey(item.status);
  const startedAtIso = previousCard?.startedAtIso || item.lastOccurredAt;
  const startedAt = previousCard?.startedAt || formatTimestamp(startedAtIso);
  const updatedAt = formatRelativeTime(item.lastOccurredAt, {
    now: new Date(),
  });

  return {
    id: item.id,
    title: item.title,
    workspaceId: item.workspaceId,
    workspaceName: item.workspaceName,
    summary: item.summary,
    statusKey,
    status: getStatusBadge(statusKey),
    trigger: item.trigger,
    startedAtIso,
    updatedAtIso: item.lastOccurredAt,
    startedAt,
    updatedAt,
    duration: previousCard?.duration || formatDuration(
      Math.max(60_000, new Date(item.lastOccurredAt).getTime() - new Date(startedAtIso).getTime()),
    ),
    progressLabel: statusKey === "completed" ? "100%" : statusKey === "queued" ? "20%" : "70%",
    progressValue: statusKey === "completed" ? 1 : statusKey === "queued" ? 0.2 : 0.7,
    operator: item.operator,
    changeId: item.changeId,
  };
}

function mergeRealtimeRunCards(base: RunsPageVm, patch: ReturnType<typeof extractRunEventPatch>) {
  if (!patch) {
    return null;
  }

  const currentCards = [...base.active, ...base.history];
  const currentCard = currentCards.find((card) => card.id === patch.runId);
  if (!currentCard) {
    return null;
  }

  const statusKey = normalizeRunStatusKey(patch.status || currentCard.statusKey);
  const updatedAtIso = patch.updatedAt;

  return {
    ...currentCard,
    title: patch.title || currentCard.title,
    summary: patch.summary || currentCard.summary,
    statusKey,
    status: getStatusBadge(statusKey),
    operator: patch.currentRole || currentCard.operator,
    updatedAtIso,
    updatedAt: formatRelativeTime(updatedAtIso, { now: new Date() }),
    duration: currentCard.duration,
  };
}

function buildRealtimeViewModel(base: RunsPageVm, items: RunsApiItem[]): RunsPageVm {
  const previousCards = [...base.active, ...base.history];
  const previousById = new Map(previousCards.map((card) => [card.id, card]));
  const cards = items.map((item) => mapApiRunToCard(item, previousById.get(item.id)));
  const buckets = buildRunsBuckets(cards);
  return {
    ...base,
    hero: {
      ...base.hero,
      stats: [
        { label: "活跃运行", value: String(buckets.active.length) },
        { label: "历史运行", value: String(buckets.history.length) },
        { label: "失败数", value: String(cards.filter((card) => card.status.label === "失败").length) },
      ],
    },
    active: buckets.active,
    history: buckets.history,
    signals: buckets.signals,
  };
}

export function RunsRealtimeSection({ initialViewModel }: { initialViewModel: RunsPageVm }) {
  const [viewModel, setViewModel] = useState(initialViewModel);
  const [workspaceIds, setWorkspaceIds] = useState(() =>
    buildRunsWorkspaceIds(
      [...initialViewModel.active, ...initialViewModel.history],
      [
        ...initialViewModel.active.map((run) => run.workspaceId),
        ...initialViewModel.history.map((run) => run.workspaceId),
      ],
    ),
  );

  const handleRealtimeEvent = useCallback(async (eventPayload: unknown) => {
    const patch = extractRunEventPatch(eventPayload);
    if (patch) {
      setViewModel((current) => {
        const mergedCard = mergeRealtimeRunCards(current, patch);
        if (!mergedCard) {
          return current;
        }

        const cards = [...current.active, ...current.history];
        const nextCards = cards.map((card) => (card.id === mergedCard.id ? mergedCard : card));
        const buckets = buildRunsBuckets(nextCards);
        return {
          ...current,
          hero: {
            ...current.hero,
            stats: [
              { label: "活跃运行", value: String(buckets.active.length) },
              { label: "历史运行", value: String(buckets.history.length) },
              { label: "失败数", value: String(nextCards.filter((card) => card.statusKey === "failed").length) },
            ],
          },
          active: buckets.active,
          history: buckets.history,
          signals: buckets.signals,
        };
      });
      return;
    }

    const response = await fetch("/api/runs", {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const latestPayload = await response.json();
    const items = Array.isArray(latestPayload.items) ? latestPayload.items : [];
    setViewModel((current) => buildRealtimeViewModel(current, items));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function seedWorkspaceIds() {
      try {
        const response = await fetch("/api/workspaces", {
          cache: "no-store",
        });
        if (!response.ok || cancelled) {
          return;
        }
        const payload = await response.json();
        const fetchedIds = Array.isArray(payload.items)
          ? payload.items
              .map((item: unknown) => readString(asRecord(item), "id"))
              .filter(Boolean)
          : [];
        if (fetchedIds.length > 0) {
          setWorkspaceIds((current) => {
            const next = buildRunsWorkspaceIds([], [...current, ...fetchedIds]);
            return next.length === current.length && next.every((item, index) => item === current[index])
              ? current
              : next;
          });
        }
      } catch (_error) {
        // 订阅种子失败只影响实时覆盖范围，不阻塞页面。
      }
    }

    void seedWorkspaceIds();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <RealtimeWorkspaceBridge
          label="运行订阅"
          workspaceIds={workspaceIds}
          onEvent={handleRealtimeEvent}
        />
      </div>
      <RunsTimeline viewModel={viewModel} />
    </>
  );
}
