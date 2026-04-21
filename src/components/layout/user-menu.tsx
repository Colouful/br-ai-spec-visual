"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { getRoleLabel, type UserRole } from "@/lib/permissions";
import { formatInitials } from "@/lib/utils";

export function UserMenu({
  user,
}: {
  user: { name: string; email: string; role: UserRole };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 backdrop-blur transition hover:border-white/20"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-[10px] font-semibold text-slate-900">
          {formatInitials(user.name) || "··"}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-medium text-white">{user.name}</span>
          <span className="block text-[10px] text-slate-400">
            {getRoleLabel(user.role)}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-white/12 bg-[#0a0f1a]/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-semibold text-slate-900">
                {formatInitials(user.name) || "··"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
              <span>当前角色</span>
              <span className="ml-auto rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-200">
                {getRoleLabel(user.role)}
              </span>
            </div>

            <form action={logoutAction} className="mt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                退出登录
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
