import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { getInstallationsStats } from "@/lib/services/installations-query";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireApiRole("admin");
  if ("response" in guard) return guard.response;

  const stats = await getInstallationsStats();
  return NextResponse.json(stats);
}
