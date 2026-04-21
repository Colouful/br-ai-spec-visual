import { LoginForm } from "@/components/auth/login-form";
import { LoginHero } from "@/components/auth/login-hero";
import { getLoginAccountHints } from "@/lib/auth/local-accounts";
import {
  redirectIfAuthenticated,
  sanitizeRedirectTarget,
} from "@/lib/auth/server";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeRedirectTarget(pickParam(params.next) || "/overview");
  const notice =
    pickParam(params.reason) === "forbidden"
      ? "当前账号没有访问目标模块的权限，请切换更高角色账号后重试。"
      : undefined;

  await redirectIfAuthenticated(nextPath);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-stretch gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <LoginHero accountHints={getLoginAccountHints()} />
        <div className="flex items-center justify-center">
          <LoginForm nextPath={nextPath} notice={notice} />
        </div>
      </div>
    </div>
  );
}
