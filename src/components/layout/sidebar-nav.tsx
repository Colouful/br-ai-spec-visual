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
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { NavigationIcon, NavigationSection } from "./navigation";

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
  workflow: Workflow,
};

export function SidebarNav({ sections }: { sections: NavigationSection[] }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.id}>
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">
            {section.label}
          </p>
          <div className="mt-3 space-y-1">
            {section.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-cyan-300 via-indigo-400 to-purple-400 shadow-[0_0_14px_rgba(34,211,238,0.7)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                      active
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                        : "border-white/8 bg-white/[0.03] text-slate-400 group-hover:border-white/15 group-hover:text-slate-200",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
