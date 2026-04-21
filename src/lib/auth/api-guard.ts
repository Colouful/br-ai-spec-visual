import { NextResponse } from "next/server";

import { getCurrentUser, type AuthUser } from "@/lib/auth/server";
import { canAccessRole, type UserRole } from "@/lib/permissions";

export async function requireApiRole(
  role: UserRole,
): Promise<{ user: AuthUser } | { response: Response }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    };
  }
  if (!canAccessRole(user.role, role)) {
    return {
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { user };
}
