"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import type { UserRole } from "@/lib/permissions";

import {
  getWorkspaceNavigationSections,
  type NavigationSection,
} from "./navigation";
import { SidebarNav } from "./sidebar-nav";

interface AppShellNavProps {
  platformSections: NavigationSection[];
  userRole: UserRole;
  workspaceLabelMap?: Record<string, string>;
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

export function AppShellNav({
  platformSections,
  userRole,
  workspaceLabelMap = {},
}: AppShellNavProps) {
  const pathname = usePathname();
  const slug = extractWorkspaceSlug(pathname);
  const workspaceLabel = slug ? workspaceLabelMap[slug] ?? slug : null;

  const workspaceSections = useMemo(() => {
    if (!slug) return null;
    return getWorkspaceNavigationSections(userRole, slug);
  }, [slug, userRole]);

  if (workspaceSections && workspaceSections.length > 0) {
    const labeled = workspaceSections.map((section, idx) =>
      idx === 0 && workspaceLabel
        ? { ...section, label: workspaceLabel }
        : section,
    );
    return (
      <div className="space-y-8">
        <SidebarNav sections={labeled} />
        <div className="border-t border-white/5 pt-6">
          <SidebarNav sections={platformSections} />
        </div>
      </div>
    );
  }

  return <SidebarNav sections={platformSections} />;
}
