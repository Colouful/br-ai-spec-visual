import { Activity, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { getRoleLabel, type UserRole } from "@/lib/permissions";

interface LoginAccountHint {
  email: string;
  label: string;
  password: string;
  role: UserRole;
  username: string;
}

interface LoginHeroProps {
  accountHints: LoginAccountHint[];
}

const ROLE_TONES: Record<UserRole, "accent" | "muted" | "warm"> = {
  admin: "warm",
  maintainer: "accent",
  viewer: "muted",
};

export function LoginHero({ accountHints }: LoginHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-950 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]">
      <div className="hero-grid absolute inset-0 opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(45,212,191,0.22),_transparent_28%),radial-gradient(circle_at_80%_18%,_rgba(245,158,11,0.18),_transparent_24%),radial-gradient(circle_at_55%_78%,_rgba(148,163,184,0.18),_transparent_32%)]" />
      <div className="relative flex h-full flex-col gap-10 p-7 sm:p-9 lg:p-10">
        <div className="flex items-center justify-between gap-4">
          <BrandMark className="text-white [&_p:last-child]:text-white [&_p:first-child]:text-slate-300" />
          <Badge
            className="bg-white/[0.08] text-white ring-white/10"
            variant="muted"
          >
            本地认证壳层
          </Badge>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.34em] text-teal-200/80">
                壳层 / 认证 / 控制台
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                让规范、执行和审计在一个控制台里闭环协作。
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                登录后按角色切换可见导航，服务端读取 cookie session，
                将认证边界留在服务器，把交互边界留给最小客户端组件。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <ShieldCheck className="h-5 w-5 text-teal-200" />
                <p className="mt-4 text-2xl font-semibold">3 档</p>
                <p className="mt-1 text-sm text-slate-300">角色权限层级</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <Activity className="h-5 w-5 text-amber-200" />
                <p className="mt-4 text-2xl font-semibold">服务端</p>
                <p className="mt-1 text-sm text-slate-300">服务端鉴权优先</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <Sparkles className="h-5 w-5 text-slate-200" />
                <p className="mt-4 text-2xl font-semibold">Next.js 16</p>
                <p className="mt-1 text-sm text-slate-300">应用路由壳层</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[320px] rounded-[28px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
            <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-slate-300/70">
              <span>角色矩阵</span>
              <span>控制台脉冲</span>
            </div>

            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-[radial-gradient(circle,_rgba(45,212,191,0.22),_transparent_60%)] pulse-ring" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.08]" />

            <div className="animate-float-slow absolute left-8 top-16 rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-xl">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
                管理员
              </p>
              <p className="mt-2 text-lg font-semibold">治理与配置</p>
              <p className="mt-1 text-sm text-slate-300">成员、系统、策略</p>
            </div>

            <div className="animate-float-fast absolute bottom-14 left-10 rounded-3xl border border-white/10 bg-white/[0.08] px-4 py-3 shadow-xl">
              <p className="text-xs uppercase tracking-[0.26em] text-teal-200/80">
                维护者
              </p>
              <p className="mt-2 text-lg font-semibold">执行与回归</p>
              <p className="mt-1 text-sm text-slate-300">任务、运行、审阅</p>
            </div>

            <div className="animate-float-slow absolute right-8 top-24 rounded-3xl border border-white/10 bg-white/[0.08] px-4 py-3 shadow-xl [animation-delay:1.4s]">
              <p className="text-xs uppercase tracking-[0.26em] text-amber-200/80">
                观察者
              </p>
              <p className="mt-2 text-lg font-semibold">观察与检索</p>
              <p className="mt-1 text-sm text-slate-300">总览、规范资产</p>
            </div>

            <div className="absolute inset-x-8 bottom-7 rounded-[24px] border border-white/10 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    会话边界
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    认证在服务器闭环，导航按角色收敛
                  </p>
                </div>
                <div className="rounded-full bg-teal-500/12 px-3 py-1 text-xs font-medium text-teal-200 ring-1 ring-teal-500/25">
                  Cookie 会话
                </div>
              </div>
            </div>
          </div>
        </div>

        {accountHints.length > 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">本地演示账号</p>
                <p className="mt-1 text-sm text-slate-300">
                  未配置 `LOCAL_AUTH_USERS` 时自动启用，可直接用来验收登录页和角色导航。
                </p>
              </div>
              <Badge
                className="bg-white/[0.08] text-slate-100 ring-white/10"
                variant="muted"
              >
                默认密码：Console#2026
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {accountHints.map((account) => (
                <div
                  className="rounded-3xl border border-white/10 bg-slate-900/60 p-4"
                  key={account.email}
                >
                  <Badge variant={ROLE_TONES[account.role]}>
                    {getRoleLabel(account.role)}
                  </Badge>
                  <p className="mt-3 text-base font-semibold text-white">
                    {account.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{account.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                    用户名：{account.username}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
