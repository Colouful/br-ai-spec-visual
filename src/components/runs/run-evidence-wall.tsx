"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  RunEvidenceStage,
  RunEvidenceStageId,
} from "@/lib/view-models/runs";

interface Props {
  stages: RunEvidenceStage[];
}

export function RunEvidenceWall({ stages }: Props) {
  const initial =
    stages.find((stage) => stage.artifacts.length > 0)?.id || stages[0]?.id;
  const [activeId, setActiveId] = useState<RunEvidenceStageId | undefined>(
    initial,
  );
  const active = stages.find((stage) => stage.id === activeId) || stages[0];

  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(8,15,25,0.96),rgba(13,21,34,0.88))] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            证据墙
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            按阶段累积的产物
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => {
            const count = stage.artifacts.length;
            const isActive = stage.id === active?.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveId(stage.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  isActive
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                }`}
              >
                {stage.label}
                <span className="ml-2 rounded-full bg-black/30 px-1.5 font-mono text-[10px] text-white/70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {!active || active.artifacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/50">
            该阶段暂无文档产出（auto 写入 ChangeDocument 后会出现在这里）。
          </p>
        ) : (
          active.artifacts.map((artifact) => (
            <article
              key={artifact.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {artifact.href ? (
                    <Link
                      href={artifact.href}
                      className="text-sm font-medium text-white hover:text-cyan-300"
                    >
                      {artifact.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {artifact.title}
                    </span>
                  )}
                  <p className="mt-1 truncate font-mono text-[11px] text-white/50">
                    {artifact.sourcePath}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                    {artifact.docType}
                  </span>
                  {artifact.status ? (
                    <span className="text-[11px] text-white/50">
                      {artifact.status}
                    </span>
                  ) : null}
                  <span className="text-[10px] text-white/40">
                    {new Date(artifact.updatedAt).toLocaleString("zh-CN")}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
