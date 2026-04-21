"use client";

import { useEffect, useState } from "react";

import { formatDuration, formatRelativeTime } from "@/lib/view-models/formatters";

function getSnapshot(startedAt: string, updatedAt: string) {
  const now = new Date();

  return {
    duration: formatDuration(
      Math.max(0, now.getTime() - new Date(startedAt).getTime()),
    ),
    updated: formatRelativeTime(updatedAt, {
      now,
      timeZone: "Asia/Shanghai",
    }),
  };
}

export function RunLiveClock({
  startedAt,
  updatedAt,
}: {
  startedAt: string;
  updatedAt: string;
}) {
  const [snapshot, setSnapshot] = useState(() => getSnapshot(startedAt, updatedAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSnapshot(getSnapshot(startedAt, updatedAt));
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [startedAt, updatedAt]);

  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime-200/80">
      live {snapshot.duration} · update {snapshot.updated}
    </p>
  );
}
