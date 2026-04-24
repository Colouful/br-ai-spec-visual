"use client";

import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const [internal, setInternal] = useState(value ?? items[0]?.id);
  const active = value ?? internal;

  const handle = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur",
        className,
      )}
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => handle(it.id)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition",
              isActive ? "text-slate-900" : "text-slate-300 hover:text-white",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="tabs-active"
                className="absolute inset-0 rounded-full bg-white shadow-[0_10px_30px_-10px_rgba(34,211,238,0.4)]"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            ) : null}
            <span className="relative">{it.label}</span>
            {typeof it.count === "number" ? (
              <span
                className={cn(
                  "relative rounded-full px-1.5 py-0.5 text-[10px] font-mono",
                  isActive
                    ? "bg-slate-900/10 text-slate-900"
                    : "bg-white/[0.08] text-slate-300",
                )}
              >
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
