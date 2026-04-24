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
import { useMemo } from "react";

import type { UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import {
  getAllWorkspaceItems,
  type NavigationIcon,
  type NavigationItem,
} from "./navigation";

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

interface MobileDockProps {
  platformItems: NavigationItem[];
  userRole: UserRole;
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

export function MobileDock({ platformItems, userRole }: MobileDockProps) {
  const pathname = usePathname();
  const slug = extractWorkspaceSlug(pathname);

  const items = useMemo(() => {
    if (slug) {
      const workspaceItems = getAllWorkspaceItems(userRole, slug);
      if (workspaceItems.length > 0) return workspaceItems.slice(0, 5);
    }
    return platformItems.slice(0, 5);
  }, [slug, userRole, platformItems]);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-white/12 bg-[#0a0f1a]/85 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const isWorkspaceRootLink = /^\/w\/[^/]+$/u.test(item.href);
          const active =
            pathname === item.href ||
            (!isWorkspaceRootLink &&
              item.href !== "/" &&
              pathname?.startsWith(item.href + "/"));
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
