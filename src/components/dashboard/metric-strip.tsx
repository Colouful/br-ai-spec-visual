"use client";

import { motion } from "framer-motion";

import { listItem, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MetricVm } from "@/lib/view-models/types";

export function MetricStrip({
  items,
  variant = "default",
}: {
  items: MetricVm[];
  variant?: "default" | "guide";
}) {
  const isGuide = variant === "guide";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={cn(
        "grid sm:grid-cols-2 xl:grid-cols-4",
        isGuide ? "gap-4" : "gap-3",
      )}
    >
      {items.map((item) => (
        <motion.div
          key={`${item.label}-${item.value}`}
          variants={listItem}
          whileHover={{ y: -2 }}
          className={cn(
            "group relative overflow-hidden border border-white/10 bg-white/[0.03] transition hover:border-white/20",
            isGuide
              ? "rounded-[28px] px-5 py-5 sm:px-6 sm:py-6"
              : "rounded-2xl px-4 py-4",
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent opacity-0 transition group-hover:opacity-100" />
          <p
            className={cn(
              "font-mono uppercase text-slate-500",
              isGuide
                ? "text-sm tracking-[0.22em] text-slate-300"
                : "text-[10px] tracking-[0.28em]",
            )}
          >
            {item.label}
          </p>
          <p
            className={cn(
              "font-semibold tracking-tight text-white",
              isGuide ? "mt-3 text-4xl sm:text-5xl" : "mt-2 text-2xl",
            )}
          >
            {item.value}
          </p>
          {item.note ? (
            <p
              className={cn(
                "leading-6 text-slate-400",
                isGuide ? "mt-3 text-sm" : "mt-2 text-xs",
              )}
            >
              {item.note}
            </p>
          ) : null}
        </motion.div>
      ))}
    </motion.div>
  );
}
