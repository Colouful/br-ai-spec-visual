"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group?: string;
}

export function CommandMenu({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rawActive, setActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.hint ?? "").toLowerCase().includes(q) ||
        (it.group ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const go = useCallback(
    (it: CommandItem) => {
      setOpen(false);
      setQuery("");
      router.push(it.href);
    },
    [router],
  );

  const active = filtered.length === 0 ? 0 : Math.min(rawActive, filtered.length - 1);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(filtered.length - 1, active + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(0, active - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[active];
      if (it) go(it);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 backdrop-blur transition hover:border-white/20 hover:text-white"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">快速跳转</span>
        <kbd className="hidden rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="cmd-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh]"
          >
            <div
              className="absolute inset-0 bg-[#05070d]/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-[min(620px,92vw)] overflow-hidden rounded-2xl border border-white/12 bg-[#0a0f1a]/95 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 border-b border-white/8 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="跳转页面、搜索工作台…"
                  className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
                <kbd className="hidden rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
                  ESC
                </kbd>
              </div>
              <div className="max-h-[56vh] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-500">
                    未找到匹配项
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {filtered.map((it, idx) => (
                      <li key={it.id}>
                        <button
                          type="button"
                          onClick={() => go(it)}
                          onMouseEnter={() => setActive(idx)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition",
                            idx === active
                              ? "bg-white/[0.08] text-white"
                              : "text-slate-300 hover:bg-white/[0.05]",
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{it.label}</span>
                            {it.hint ? (
                              <span className="text-xs text-slate-500">
                                {it.hint}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            {it.group ? (
                              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                                {it.group}
                              </span>
                            ) : null}
                            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
