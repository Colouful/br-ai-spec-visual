"use client";

import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormState {
  fieldErrors: Partial<Record<"identifier" | "password", string>>;
  message?: string;
  values: {
    identifier: string;
    password: string;
  };
}

const INITIAL_STATE: LoginFormState = {
  fieldErrors: {},
  values: { identifier: "", password: "" },
};

const DEMO_PASSWORD = "Console#2026";
const DEMO_ACCOUNTS = [
  { role: "admin@local", label: "管理员", caption: "治理", tone: "amber" as const },
  { role: "maintainer@local", label: "维护者", caption: "执行", tone: "cyan" as const },
  { role: "viewer@local", label: "观察者", caption: "观察", tone: "purple" as const },
];

interface LoginFormProps {
  nextPath: string;
  notice?: string;
}

export function LoginForm({ nextPath, notice }: LoginFormProps) {
  const router = useRouter();
  const [state, setState] = useState<LoginFormState>(INITIAL_STATE);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function fillDemoAccount(role: string) {
    setState((prev) => ({
      ...prev,
      fieldErrors: {},
      message: undefined,
      values: { identifier: role, password: DEMO_PASSWORD },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fieldErrors: LoginFormState["fieldErrors"] = {};

    if (!identifier) fieldErrors.identifier = "请输入邮箱或用户名";
    if (!password) fieldErrors.password = "请输入密码";

    if (Object.keys(fieldErrors).length > 0) {
      setState({
        fieldErrors,
        message: "请先补全登录信息",
        values: { identifier, password },
      });
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      if (!response.ok) {
        setState({
          fieldErrors: { password: "账号或密码错误" },
          message: "认证失败，请检查账号、用户名和密码是否匹配",
          values: { identifier, password },
        });
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setState({
        fieldErrors: {},
        message: "登录请求失败，请稍后再试。",
        values: { identifier, password },
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="glass-panel-strong relative w-full max-w-lg overflow-hidden rounded-[28px] p-6 xl:p-8">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <Badge variant="accent">本地账号登录</Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            进入 BR 规范控制台
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            使用本地登录接口完成认证，session 写入 HttpOnly cookie，
            页面保留最小交互并规避 Server Action 版本漂移问题。
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white shadow-lg backdrop-blur">
          <LogIn className="h-5 w-5" />
        </div>
      </div>

      {notice ? (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {notice}
        </div>
      ) : null}

      <form className="relative mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400"
            htmlFor="identifier"
          >
            邮箱或用户名
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              aria-invalid={Boolean(state.fieldErrors.identifier)}
              autoCapitalize="none"
              autoComplete="username"
              className="pl-11"
              id="identifier"
              name="identifier"
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  values: { ...prev.values, identifier: event.target.value },
                }))
              }
              placeholder="例如：admin@local"
              required
              value={state.values.identifier}
            />
          </div>
          {state.fieldErrors.identifier ? (
            <p className="text-xs text-rose-300">{state.fieldErrors.identifier}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400"
            htmlFor="password"
          >
            密码
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              aria-invalid={Boolean(state.fieldErrors.password)}
              autoComplete="current-password"
              className="pl-11 pr-12"
              id="password"
              name="password"
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  values: { ...prev.values, password: event.target.value },
                }))
              }
              placeholder="输入本地账号密码"
              required
              type={showPassword ? "text" : "password"}
              value={state.values.password}
            />
            <button
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => setShowPassword((v) => !v)}
              type="button"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors.password ? (
            <p className="text-xs text-rose-300">{state.fieldErrors.password}</p>
          ) : (
            <p className="text-xs text-slate-500">
              支持 admin(管理员) / maintainer(维护者) / viewer(观察者) 三种本地角色账号。
            </p>
          )}
        </div>

        {state.message ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            {state.message}
          </div>
        ) : null}

        <Button
          variant="aurora"
          size="lg"
          className="w-full"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              正在验证身份…
            </span>
          ) : (
            "进入控制台"
          )}
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
          一键填充演示账号
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <RolePill
              key={account.role}
              caption={account.caption}
              label={account.label}
              onSelect={() => fillDemoAccount(account.role)}
              tone={account.tone}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RolePill({
  label,
  caption,
  tone,
  onSelect,
}: {
  label: string;
  caption: string;
  tone: "amber" | "cyan" | "purple";
  onSelect: () => void;
}) {
  const color = {
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20",
    cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20",
    purple: "border-purple-400/25 bg-purple-400/10 text-purple-200 hover:bg-purple-400/20",
  }[tone];
  return (
    <button
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${color}`}
      onClick={onSelect}
      type="button"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.26em] opacity-80">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{caption}</p>
    </button>
  );
}
