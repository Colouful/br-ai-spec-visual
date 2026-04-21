"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function Tooltip({
  label,
  children,
  side = "top",
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open ? (
          <motion.span
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-white/10 bg-[#0b1220]/95 px-2.5 py-1.5 text-xs text-slate-200 shadow-xl backdrop-blur",
              pos,
              className,
            )}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
