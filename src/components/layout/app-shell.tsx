import {
  Activity,
  FileStack,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { getRoleLabel } from "@/lib/permissions";
import { formatInitials } from "@/lib/utils";

import { getNavigationSections, type NavigationIcon } from "./navigation";

const ICONS: Record<NavigationIcon, typeof LayoutDashboard> = {
  activity: Activity,
  "file-stack": FileStack,
  "layout-dashboard": LayoutDashboard,
  "list-todo": ListTodo,
  settings: Settings,
  users: Users,
};

interface AppShellProps {
  children: ReactNode;
  user: {
    email: string;
    id: string;
    name: string;
    role: "admin" | "maintainer" | "viewer";
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const sections = getNavigationSections(user.role);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.98))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-slate-200/80 bg-white/78 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-4 sm:p-6">
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-6 text-white shadow-[0_22px_40px_-28px_rgba(15,23,42,0.82)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    控制台壳层
                  </p>
                  <p className="mt-3 text-xl font-semibold">BR 规范控制台</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <ShieldCheck className="h-5 w-5 text-teal-200" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                受保护布局负责统一壳层与角色导航；具体数据权限仍应在页面或数据访问层复核。
              </p>
            </div>

            <nav className="mt-6 flex gap-3 overflow-x-auto pb-2 lg:hidden">
              {sections.flatMap((section) => section.items).map((item) => {
                const Icon = ICONS[item.icon];

                return (
                  <Link
                    className="flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 hidden flex-1 lg:block">
              <div className="space-y-6">
                {sections.map((section) => (
                  <section key={section.id}>
                    <p className="px-2 text-xs font-medium uppercase tracking-[0.28em] text-slate-400">
                      {section.label}
                    </p>
                    <div className="mt-3 space-y-2">
                      {section.items.map((item) => {
                        const Icon = ICONS[item.icon];

                        return (
                          <Link
                            className="group flex items-start gap-3 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                            href={item.href}
                            key={item.href}
                          >
                            <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                {item.summary}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                  {formatInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-500">{getRoleLabel(user.role)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{user.email}</p>

              <form action={logoutAction} className="mt-4">
                <button
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                  type="submit"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/78 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                受保护布局
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                    控制台已准备就绪
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    当前导航根据角色 {getRoleLabel(user.role)} 自动收敛显示。
                  </p>
                </div>
                <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                  当前角色：{getRoleLabel(user.role)}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="min-h-[calc(100vh-11rem)] rounded-[32px] border border-slate-200/80 bg-white/82 p-4 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.42)] backdrop-blur sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
