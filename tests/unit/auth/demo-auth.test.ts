import { afterEach, describe, expect, it, vi } from "vitest";

async function loadDemoAuth() {
  vi.resetModules();
  return import("@/lib/auth/demo-auth");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demo auth mode", () => {
  it("VISUAL_AUTH_MODE=demo 且非生产环境时返回 demo 用户", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VISUAL_AUTH_MODE", "demo");

    const { createDemoUser, isDemoAuthEnabled } = await loadDemoAuth();

    expect(isDemoAuthEnabled()).toBe(true);
    expect(createDemoUser()).toEqual({
      email: "demo-user@demo.local",
      id: "demo-user",
      isDemo: true,
      name: "演示用户",
      role: "admin",
      teamId: "demo-team",
    });
  });

  it("demo 用户优先读取环境变量配置", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VISUAL_AUTH_MODE", "demo");
    vi.stubEnv("VISUAL_DEMO_USER_ID", "local-demo");
    vi.stubEnv("VISUAL_DEMO_USER_NAME", "本地演示用户");
    vi.stubEnv("VISUAL_DEMO_TEAM_ID", "local-team");

    const { createDemoUser } = await loadDemoAuth();

    expect(createDemoUser()).toMatchObject({
      email: "local-demo@demo.local",
      id: "local-demo",
      isDemo: true,
      name: "本地演示用户",
      role: "admin",
      teamId: "local-team",
    });
  });

  it("NODE_ENV=production 且 VISUAL_AUTH_MODE=demo 时阻断加载", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VISUAL_AUTH_MODE", "demo");

    await expect(loadDemoAuth()).rejects.toThrow("生产环境禁止开启演示登录模式");
  });

  it("未开启 demo mode 时不启用演示登录", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VISUAL_AUTH_MODE", "local");

    const { isDemoAuthEnabled } = await loadDemoAuth();

    expect(isDemoAuthEnabled()).toBe(false);
  });
});
