"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getRoleLabel, type UserRole } from "@/lib/permissions";
import { formatInitials } from "@/lib/utils";

export function UserMenu({
  user,
}: {
  user: { name: string; email: string; role: UserRole };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setOpen(false);
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-control-bg)] py-1.5 pl-1.5 pr-3 backdrop-blur transition hover:border-[var(--shell-border-strong)]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-[10px] font-semibold text-slate-900">
          {formatInitials(user.name) || "··"}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-medium text-[var(--shell-fg)]">{user.name}</span>
          <span className="block text-[10px] text-[var(--shell-muted)]">
            {getRoleLabel(user.role)}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--shell-muted)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-dropdown-bg)] p-2 shadow-[var(--shell-dropdown-shadow)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 rounded-xl bg-[var(--shell-control-bg)] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-semibold text-slate-900">
                {formatInitials(user.name) || "··"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--shell-fg)]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[var(--shell-muted)]">{user.email}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--shell-control-bg)] px-3 py-2 text-xs text-[var(--shell-muted)]">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
              <span>当前角色</span>
              <span className="ml-auto rounded-full border border-[var(--shell-border)] bg-[var(--shell-control-bg-hover)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--shell-fg)]">
                {getRoleLabel(user.role)}
              </span>
            </div>

            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={loggingOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-control-bg)] px-3 py-2 text-xs font-medium text-[var(--shell-fg)] transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-500"
              >
                <LogOut className="h-3.5 w-3.5" />
                {loggingOut ? "退出中…" : "退出登录"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
