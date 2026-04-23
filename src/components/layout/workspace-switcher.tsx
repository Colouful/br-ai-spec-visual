"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsUpDown, Folders, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceSummary[];
}

function extractWorkspaceSlug(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/w\/([^/]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function buildTargetHref(currentPath: string | null, slug: string): string {
  const safeSlug = encodeURIComponent(slug);
  if (!currentPath) return `/w/${safeSlug}`;
  const match = currentPath.match(/^\/w\/[^/]+(\/.*)?$/);
  if (!match) return `/w/${safeSlug}`;
  const tail = match[1] ?? "";
  return `/w/${safeSlug}${tail}`;
}

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement | null>(null);
  const currentSlug = extractWorkspaceSlug(pathname);

  const current = useMemo(
    () => workspaces.find((ws) => ws.slug === currentSlug) ?? null,
    [workspaces, currentSlug],
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (ws) =>
        ws.name.toLowerCase().includes(q) ||
        ws.slug.toLowerCase().includes(q) ||
        (ws.description ?? "").toLowerCase().includes(q),
    );
  }, [workspaces, query]);

  const hasWorkspaces = workspaces.length > 0;

  if (!hasWorkspaces) {
    return (
      <Link
        href="/workspaces"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-control-bg)] px-3 py-1.5 text-xs text-[var(--shell-muted)] transition hover:border-[var(--shell-border-strong)] hover:text-[var(--shell-fg)]"
      >
        <Folders className="h-3.5 w-3.5" />
        创建工作区
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex max-w-[260px] items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-control-bg)] px-3 py-1.5 text-xs transition hover:border-[var(--shell-border-strong)]",
          open
            ? "border-[var(--shell-border-strong)] text-[var(--shell-fg)]"
            : "text-[var(--shell-fg)]",
        )}
      >
        <Folders className="h-3.5 w-3.5 text-cyan-300" />
        <span className="truncate font-medium">
          {current ? current.name : "选择工作区"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(380px,90vw)] overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-dropdown-bg)] shadow-[var(--shell-dropdown-shadow)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--shell-border)] px-3">
              <Search className="h-3.5 w-3.5 text-[var(--shell-muted)]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索工作区…"
                className="h-10 flex-1 bg-transparent text-xs text-[var(--shell-fg)] outline-none placeholder:text-[var(--shell-muted)]"
              />
            </div>
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--shell-muted)]">
                  未找到匹配的工作区
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {filtered.map((ws) => {
                    const active = ws.slug === currentSlug;
                    const href = buildTargetHref(pathname, ws.slug);
                    return (
                      <li key={ws.slug}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                            router.push(href);
                          }}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
                            active
                              ? "bg-[var(--shell-selected-bg)] text-[var(--shell-fg)]"
                              : "text-[var(--shell-muted)] hover:bg-[var(--shell-control-bg-hover)] hover:text-[var(--shell-fg)]",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ws.name}</p>
                            <p className="truncate text-[11px] text-[var(--shell-muted)]">
                              {ws.description || ws.slug}
                            </p>
                          </div>
                          {active ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-[var(--shell-border)] p-1.5">
              <Link
                href="/workspaces"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-[var(--shell-muted)] transition hover:bg-[var(--shell-control-bg-hover)] hover:text-[var(--shell-fg)]"
              >
                <span>查看全部工作区</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--shell-muted)]">
                  /workspaces
                </span>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
