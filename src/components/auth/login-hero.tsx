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
    <section className="glass-panel relative overflow-hidden rounded-[32px]">
      <div className="hero-grid absolute inset-0 opacity-40" />
      <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-24 right-[-6rem] h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

      <div className="relative flex h-full flex-col gap-10 p-7 sm:p-9 lg:p-10">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <Badge variant="aurora">本地认证壳层</Badge>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/80">
                壳层 / 认证 / 控制台
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                让{" "}
                <span className="text-gradient-aurora animate-aurora-shift">
                  规范、执行和审计
                </span>{" "}
                在一个控制台里闭环协作。
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                登录后按角色切换可见导航，服务端读取 cookie session，
                将认证边界留在服务器，把交互边界留给最小客户端组件。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat
                icon={<ShieldCheck className="h-5 w-5 text-cyan-300" />}
                title="3 档"
                desc="角色权限层级"
              />
              <HeroStat
                icon={<Activity className="h-5 w-5 text-amber-300" />}
                title="服务端"
                desc="服务端鉴权优先"
              />
              <HeroStat
                icon={<Sparkles className="h-5 w-5 text-purple-300" />}
                title="应用壳层"
                desc="同构路由与流式界面"
              />
            </div>
          </div>

          <div className="relative min-h-[340px] rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="absolute inset-x-5 top-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
              <span>角色矩阵</span>
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </span>
                控制台脉冲
              </span>
            </div>

            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-[radial-gradient(circle,_rgba(34,211,238,0.22),_transparent_60%)] pulse-ring" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.08]" />

            <div className="animate-float-slow absolute left-8 top-16 rounded-2xl border border-white/10 bg-[#0a0f1a]/80 px-4 py-3 shadow-xl backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-200/80">
                管理员
              </p>
              <p className="mt-2 text-base font-semibold text-white">治理与配置</p>
              <p className="mt-1 text-xs text-slate-400">成员、系统、策略</p>
            </div>

            <div className="animate-float-fast absolute bottom-16 left-12 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 shadow-xl backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-cyan-200">
                维护者
              </p>
              <p className="mt-2 text-base font-semibold text-white">执行与回归</p>
              <p className="mt-1 text-xs text-slate-300">任务、运行、审阅</p>
            </div>

            <div className="animate-float-slow absolute right-6 top-28 rounded-2xl border border-purple-400/20 bg-purple-400/10 px-4 py-3 shadow-xl backdrop-blur [animation-delay:1.4s]">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-purple-200">
                观察者
              </p>
              <p className="mt-2 text-base font-semibold text-white">观察与检索</p>
              <p className="mt-1 text-xs text-slate-300">总览、规范资产</p>
            </div>

            <div className="absolute inset-x-8 bottom-7 rounded-2xl border border-white/10 bg-[#05070d]/80 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    会话边界
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    服务器闭环 · 导航按角色收敛
                  </p>
                </div>
                <Badge variant="accent">Cookie 会话</Badge>
              </div>
            </div>
          </div>
        </div>

        {accountHints.length > 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">本地演示账号</p>
                <p className="mt-1 text-xs text-slate-400">
                  未配置 LOCAL_AUTH_USERS 时自动启用，可直接用来验收登录页与角色导航。
                </p>
              </div>
              <Badge variant="muted">默认密码：Console#2026</Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {accountHints.map((account) => (
                <div
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                  key={account.email}
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <Badge variant={ROLE_TONES[account.role]}>
                    {getRoleLabel(account.role)}
                  </Badge>
                  <p className="mt-3 text-base font-semibold text-white">
                    {account.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{account.email}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
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

function HeroStat({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      {icon}
      <p className="mt-4 text-2xl font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{desc}</p>
    </div>
  );
}
