import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { listActiveInstallations } from "@/server/installations-presence";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireApiRole("admin");
  if ("response" in guard) return guard.response;

  const items = listActiveInstallations().map((item) => ({
    ...item,
    lastSeenAt: new Date(item.lastSeenAt).toISOString(),
  }));
  return NextResponse.json({ items, count: items.length });
}
