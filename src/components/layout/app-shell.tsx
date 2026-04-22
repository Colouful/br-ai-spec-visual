import type { ReactNode } from "react";

import { BrandMark } from "@/components/ui/brand-mark";
import { CommandMenu, type CommandItem } from "@/components/ui/command-menu";
import { MotionPage } from "@/components/ui/motion-primitives";
import type { UserRole } from "@/lib/permissions";
import { listWorkspaceSummaries } from "@/lib/workspace-context/server";

import { AppShellNav } from "./app-shell-nav";
import { Breadcrumbs } from "./breadcrumbs";
import { MobileDock } from "./mobile-dock";
import {
  getAllPlatformItems,
  getPlatformNavigationSections,
} from "./navigation";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface AppShellProps {
  children: ReactNode;
  user: {
    email: string;
    id: string;
    name: string;
    role: UserRole;
  };
}

export async function AppShell({ children, user }: AppShellProps) {
  const platformSections = getPlatformNavigationSections(user.role);
  const platformItems = getAllPlatformItems(user.role);

  const workspaces = await listWorkspaceSummaries();
  const switcherWorkspaces = workspaces.map((ws) => ({
    id: ws.id,
    slug: ws.slug,
    name: ws.name,
    description: ws.description,
  }));

  const commandItems: CommandItem[] = platformItems.map((it) => ({
    id: it.href,
    label: it.label,
    hint: it.summary,
    href: it.href,
    group: "平台",
  }));

  return (
    <div className="relative min-h-screen text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[280px] lg:shrink-0 lg:flex-col lg:border-r lg:border-white/8 lg:bg-[#070b14]/60 lg:backdrop-blur-xl">
          <div className="flex h-full flex-col p-5">
            <div className="glass-panel relative overflow-hidden rounded-2xl p-4">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
              <BrandMark />
              <p className="mt-4 text-xs leading-6 text-slate-400">
                规范驱动 AI 研发的可视化与控制面板，多项目运行态一屏尽览。
              </p>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              <AppShellNav
                platformSections={platformSections}
                userRole={user.role}
                workspaceLabelMap={Object.fromEntries(
                  workspaces.map((w) => [w.slug, w.name]),
                )}
              />
            </div>

            <div className="glass-panel mt-4 rounded-2xl p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-lime-400/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-lime-400" />
                </span>
                实时在线
              </div>
              <p className="mt-2 text-xs text-slate-400">
                WebSocket 与采集器持续同步。
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[#05070d]/70 backdrop-blur-xl">
            <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <BrandMark compact />
              </div>
              <div className="hidden min-w-0 flex-1 lg:block">
                <Breadcrumbs workspaceLabelMap={Object.fromEntries(workspaces.map((w) => [w.slug, w.name]))} />
              </div>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <WorkspaceSwitcher workspaces={switcherWorkspaces} />
                <CommandMenu items={commandItems} />
                <UserMenu user={user} />
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </header>

          <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
            <MotionPage className="min-h-[calc(100vh-7rem)]">
              {children}
            </MotionPage>
          </main>
        </div>
      </div>

      <MobileDock platformItems={platformItems} userRole={user.role} />
    </div>
  );
}
