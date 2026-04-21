"use server";

import { redirect } from "next/navigation";

import { loginWithCredentials, sanitizeRedirectTarget } from "@/lib/auth/server";

export interface LoginFormState {
  fieldErrors: Partial<Record<"identifier" | "password", string>>;
  message?: string;
  values: {
    identifier: string;
  };
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeRedirectTarget(String(formData.get("next") ?? "/"));
  const fieldErrors: LoginFormState["fieldErrors"] = {};

  if (!identifier) {
    fieldErrors.identifier = "请输入邮箱或用户名";
  }

  if (!password) {
    fieldErrors.password = "请输入密码";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "请先补全登录信息",
      values: {
        identifier,
      },
    };
  }

  const user = await loginWithCredentials(identifier, password);

  if (!user) {
    return {
      fieldErrors: {
        password: "账号或密码错误",
      },
      message: "认证失败，请检查账号、用户名和密码是否匹配",
      values: {
        identifier,
      },
    };
  }

  redirect(nextPath);
}
