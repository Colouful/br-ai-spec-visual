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
  };
}

const INITIAL_STATE: LoginFormState = {
  fieldErrors: {},
  values: {
    identifier: "",
  },
};

interface LoginFormProps {
  nextPath: string;
  notice?: string;
}

export function LoginForm({ nextPath, notice }: LoginFormProps) {
  const router = useRouter();
  const [state, setState] = useState<LoginFormState>(INITIAL_STATE);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fieldErrors: LoginFormState["fieldErrors"] = {};

    if (!identifier) {
      fieldErrors.identifier = "请输入邮箱或用户名";
    }
    if (!password) {
      fieldErrors.password = "请输入密码";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setState({
        fieldErrors,
        message: "请先补全登录信息",
        values: { identifier },
      });
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: identifier,
          password,
        }),
      });

      if (!response.ok) {
        setState({
          fieldErrors: {
            password: "账号或密码错误",
          },
          message: "认证失败，请检查账号、用户名和密码是否匹配",
          values: { identifier },
        });
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (_error) {
      setState({
        fieldErrors: {},
        message: "登录请求失败，请稍后再试。",
        values: { identifier },
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="w-full max-w-lg rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur xl:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="accent">本地账号登录</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            进入 BR 规范控制台
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            使用本地登录接口完成认证，session 写入 HttpOnly cookie，
            页面保留最小交互并规避 Server Action 版本漂移问题。
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg">
          <LogIn className="h-5 w-5" />
        </div>
      </div>

      {notice ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notice}
        </div>
      ) : null}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="identifier">
            邮箱或用户名
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-invalid={Boolean(state.fieldErrors.identifier)}
              autoCapitalize="none"
              autoComplete="username"
              className="pl-11"
              defaultValue={state.values.identifier}
              id="identifier"
              name="identifier"
              placeholder="例如：admin@local 或 admin"
              required
            />
          </div>
          {state.fieldErrors.identifier ? (
            <p className="text-sm text-rose-600">{state.fieldErrors.identifier}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            密码
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-invalid={Boolean(state.fieldErrors.password)}
              autoComplete="current-password"
              className="pl-11 pr-12"
              id="password"
              name="password"
              placeholder="输入本地账号密码"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {state.fieldErrors.password ? (
            <p className="text-sm text-rose-600">{state.fieldErrors.password}</p>
          ) : (
            <p className="text-sm text-slate-500">
            支持 `admin(管理员)`、`maintainer(维护者)`、`viewer(观察者)` 三种本地角色账号。
            </p>
          )}
        </div>

        {state.message ? (
          <div
            aria-live="polite"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {state.message}
          </div>
        ) : null}

        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "正在验证身份…" : "进入控制台"}
        </Button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">管理员</p>
          <p className="mt-2 text-sm font-semibold">治理</p>
        </div>
        <div className="rounded-3xl bg-teal-50 px-4 py-4 text-teal-900 ring-1 ring-teal-100">
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700/70">维护者</p>
          <p className="mt-2 text-sm font-semibold">执行</p>
        </div>
        <div className="rounded-3xl bg-amber-50 px-4 py-4 text-amber-900 ring-1 ring-amber-100">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-700/70">观察者</p>
          <p className="mt-2 text-sm font-semibold">观察</p>
        </div>
      </div>
    </section>
  );
}
