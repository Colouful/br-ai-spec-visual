"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  FileStack,
  Folders,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  Network,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { NavigationIcon, NavigationItem } from "./navigation";

const ICONS: Record<NavigationIcon, typeof LayoutDashboard> = {
  activity: Activity,
  "bar-chart": BarChart3,
  "file-stack": FileStack,
  folders: Folders,
  "git-branch": GitBranch,
  "layout-dashboard": LayoutDashboard,
  "list-todo": ListTodo,
  network: Network,
  settings: Settings,
  users: Users,
};

export function MobileDock({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const visible = items.slice(0, 5);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-white/12 bg-[#0a0f1a]/85 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {visible.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition",
                active ? "text-white" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-dock-active"
                  className="absolute inset-0 rounded-xl bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <Icon className="relative h-4 w-4" />
              <span className="relative truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
