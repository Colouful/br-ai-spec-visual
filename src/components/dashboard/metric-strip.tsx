"use client";

import { motion } from "framer-motion";

import { listItem, staggerContainer } from "@/lib/motion";
import type { MetricVm } from "@/lib/view-models/types";

export function MetricStrip({ items }: { items: MetricVm[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <motion.div
          key={`${item.label}-${item.value}`}
          variants={listItem}
          whileHover={{ y: -2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-white/20"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent opacity-0 transition group-hover:opacity-100" />
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {item.value}
          </p>
          {item.note ? (
            <p className="mt-2 text-xs leading-6 text-slate-400">{item.note}</p>
          ) : null}
        </motion.div>
      ))}
    </motion.div>
  );
}
