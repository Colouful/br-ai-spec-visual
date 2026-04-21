"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface TraceItem {
  id: string;
  runKey: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown> | null;
}

interface Props {
  workspaceId: string;
  label?: string;
  refreshIntervalMs?: number;
}

function categoryFor(eventType: string) {
  const value = eventType.toLowerCase();
  if (value.startsWith("control.")) return "control";
  if (value.includes("receipt")) return "receipt";
  if (value.includes("state")) return "state";
  return "other";
}

const CATEGORY_STYLE: Record<string, string> = {
  state: "bg-cyan-500/15 text-cyan-100 border-cyan-300/30",
  control: "bg-amber-500/15 text-amber-100 border-amber-300/30",
  receipt: "bg-emerald-500/15 text-emerald-100 border-emerald-300/30",
  other: "bg-white/5 text-white/70 border-white/15",
};

export function TraceStreamDrawer({
  workspaceId,
  label = "Trace Stream",
  refreshIntervalMs = 5000,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TraceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/trace/recent?workspace_id=${encodeURIComponent(workspaceId)}&limit=80`,
        { cache: "no-store", credentials: "include" },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as { items: TraceItem[] };
      setItems(json.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!open) return;
    void fetchData();
    const id = window.setInterval(fetchData, refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [open, fetchData, refreshIntervalMs]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
      >
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,15,25,0.96),rgba(13,21,34,0.96))] p-5 shadow-2xl"
          >
            <header className="flex items-baseline justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                  Workspace
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-white/60 transition hover:text-white"
              >
                关闭
              </button>
            </header>
            <div className="mt-3 flex items-center justify-between text-xs text-white/50">
              <span>{loading ? "刷新中…" : `共 ${items.length} 条`}</span>
              <button
                type="button"
                onClick={() => fetchData()}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] hover:bg-white/10"
              >
                立即刷新
              </button>
            </div>
            {error ? (
              <p className="mt-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                {error}
              </p>
            ) : null}
            <div className="mt-3 flex-1 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
                  暂无事件
                </p>
              ) : (
                <ol className="space-y-2 border-l border-white/10 pl-4">
                  {items.map((event) => {
                    const category = categoryFor(event.eventType);
                    return (
                      <li key={event.id} className="relative">
                        <span
                          className={`absolute -left-[10px] top-3 h-2 w-2 rounded-full border ${CATEGORY_STYLE[category]}`}
                        />
                        <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <Link
                              href={`/runs/${encodeURIComponent(event.runKey)}`}
                              className="text-sm font-medium text-white hover:text-cyan-300"
                            >
                              {event.eventType}
                            </Link>
                            <span className="font-mono text-[10px] text-white/40">
                              {new Date(event.occurredAt).toLocaleTimeString("zh-CN")}
                            </span>
                          </div>
                          <p className="mt-1 truncate font-mono text-[10px] text-white/40">
                            run · {event.runKey}
                          </p>
                          {event.payload ? (
                            <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-white/60">
                              {JSON.stringify(event.payload, null, 2).slice(0, 600)}
                            </pre>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
