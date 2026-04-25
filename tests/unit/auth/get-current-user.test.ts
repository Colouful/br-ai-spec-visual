import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, findUniqueMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/db/env", () => ({
  serverEnv: {
    BR_AI_SPEC_VISUAL_COOKIE_NAME: "test-session",
    BR_AI_SPEC_VISUAL_COOKIE_SECURE: false,
    BR_AI_SPEC_VISUAL_SESSION_SECRET: "test-secret",
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    session: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: findUniqueMock,
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/bootstrap", () => ({
  ensureSeededUsers: vi.fn(),
}));

async function loadServerAuth() {
  vi.resetModules();
  return import("@/lib/auth/server");
}

beforeEach(() => {
  cookiesMock.mockReset();
  findUniqueMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCurrentUser demo auth", () => {
  it("demo mode 下直接返回 demo 用户，不读取 cookie 或数据库 session", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VISUAL_AUTH_MODE", "demo");

    const { getCurrentUser } = await loadServerAuth();
    const user = await getCurrentUser();

    expect(user).toMatchObject({
      id: "demo-user",
      isDemo: true,
      name: "演示用户",
      role: "admin",
      teamId: "demo-team",
    });
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("未开启 demo mode 时继续走原有 cookie session 认证逻辑", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VISUAL_AUTH_MODE", "off");
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    const { getCurrentUser } = await loadServerAuth();
    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(cookiesMock).toHaveBeenCalledTimes(1);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
