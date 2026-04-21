"use client";

import { useMemo, useState } from "react";

import type { RunTraceEvent } from "@/lib/view-models/runs";

const CATEGORY_LABEL: Record<RunTraceEvent["category"], string> = {
  state: "状态",
  control: "控制",
  receipt: "回执",
  other: "其它",
};

const CATEGORY_STYLE: Record<RunTraceEvent["category"], string> = {
  state: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  control: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  receipt: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  other: "border-white/15 bg-white/5 text-white/70",
};

interface Props {
  events: RunTraceEvent[];
}

export function RunTraceStream({ events }: Props) {
  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category))),
    [events],
  );
  const [filter, setFilter] = useState<RunTraceEvent["category"] | "all">("all");
  const filtered =
    filter === "all" ? events : events.filter((event) => event.category === filter);

  return (
    <div className="flex h-full max-h-[640px] flex-col rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,15,25,0.96),rgba(13,21,34,0.84))] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            事件流
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">运行事件流</h3>
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-[11px] transition ${
              filter === "all"
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`rounded-full px-3 py-1 text-[11px] transition ${
                filter === category
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {CATEGORY_LABEL[category]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
            暂无事件
          </p>
        ) : (
          <ol className="space-y-2 border-l border-white/10 pl-4">
            {filtered.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[10px] top-3 h-2 w-2 rounded-full border ${
                    CATEGORY_STYLE[event.category]
                  }`}
                />
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {event.eventType}
                    </p>
                    <span className="font-mono text-[10px] text-white/40">
                      {event.occurredAtRelative}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-[11px] leading-5 text-white/60">
                    {event.summary}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
