import type { UserRole } from "@/lib/permissions";

export interface DemoAuthUser {
  email: string;
  id: string;
  isDemo: true;
  name: string;
  role: UserRole;
  teamId: string;
}

const DEMO_MODE = "demo";
const PRODUCTION_DEMO_AUTH_ERROR = "生产环境禁止开启演示登录模式";

export function assertDemoAuthAllowed() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VISUAL_AUTH_MODE === DEMO_MODE
  ) {
    throw new Error(PRODUCTION_DEMO_AUTH_ERROR);
  }
}

assertDemoAuthAllowed();

export function isDemoAuthEnabled() {
  assertDemoAuthAllowed();
  return (
    process.env.VISUAL_AUTH_MODE === DEMO_MODE &&
    process.env.NODE_ENV !== "production"
  );
}

export function createDemoUser(): DemoAuthUser {
  assertDemoAuthAllowed();

  const id = process.env.VISUAL_DEMO_USER_ID || "demo-user";
  const name = process.env.VISUAL_DEMO_USER_NAME || "演示用户";
  const teamId = process.env.VISUAL_DEMO_TEAM_ID || "demo-team";

  return {
    email: `${id}@demo.local`,
    id,
    isDemo: true,
    name,
    role: "admin",
    teamId,
  };
}

