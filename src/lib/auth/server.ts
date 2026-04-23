import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { serverEnv } from "@/lib/db/env";
import { prisma } from "@/lib/db/prisma";
import { ensureSeededUsers } from "@/lib/db/bootstrap";
import { canAccessRole, type UserRole } from "@/lib/permissions";

import {
  decodeSessionToken,
  encodeSessionToken,
  type SessionPayload,
} from "./session-codec";

const SESSION_TTL_DAYS = 7;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function sanitizeRedirectTarget(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value === "/login" || value.startsWith("/login?")) {
    return "/";
  }

  return value;
}

function buildSessionPayload(user: AuthUser): SessionPayload {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  };
}

async function setSessionCookie(payload: SessionPayload) {
  const cookieStore = await cookies();
  const token = encodeSessionToken(payload, serverEnv.BR_AI_SPEC_VISUAL_SESSION_SECRET);

  cookieStore.set(serverEnv.BR_AI_SPEC_VISUAL_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // 仅当显式声明部署在 HTTPS 下时才打 Secure 标记。
    // Docker/内网通过 HTTP 暴露时必须为 false，否则 cookie 不会被浏览器保存。
    secure: serverEnv.BR_AI_SPEC_VISUAL_COOKIE_SECURE,
    path: "/",
    expires: new Date(payload.expiresAt),
  });

  await prisma.session.create({
    data: {
      token,
      userId: payload.id,
      expiresAt: new Date(payload.expiresAt),
    },
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(serverEnv.BR_AI_SPEC_VISUAL_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(serverEnv.BR_AI_SPEC_VISUAL_COOKIE_NAME);
}

export async function clearUserSession() {
  await clearSession();
}

export async function authenticateCredentials(email: string, password: string) {
  await ensureSeededUsers();
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !user.passwordHash) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? email.trim().toLowerCase(),
    name: user.name ?? "控制台用户",
    role: user.role,
  } satisfies AuthUser;
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await authenticateCredentials(email, password);
  if (!user) {
    return null;
  }
  await setSessionCookie(buildSessionPayload(user));
  return user;
}

export async function createUserSession(user: AuthUser) {
  await setSessionCookie(buildSessionPayload(user));
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(serverEnv.BR_AI_SPEC_VISUAL_COOKIE_NAME)?.value;
  if (!rawToken) {
    return null;
  }

  const payload = decodeSessionToken(
    rawToken,
    serverEnv.BR_AI_SPEC_VISUAL_SESSION_SECRET,
  );

  if (!payload || new Date(payload.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token: rawToken },
    include: { user: true },
  });

  if (!session || !session.user || !session.expiresAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? payload.email,
    name: session.user.name ?? payload.name,
    role: session.user.role,
  } satisfies AuthUser;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(role: UserRole, redirectTo?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const nextPath = sanitizeRedirectTarget(redirectTo);
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!canAccessRole(user.role, role)) {
    redirect("/login?reason=forbidden");
  }

  return user;
}

export async function redirectIfAuthenticated(target = "/") {
  const user = await getCurrentUser();

  if (user) {
    redirect(sanitizeRedirectTarget(target));
  }
}
