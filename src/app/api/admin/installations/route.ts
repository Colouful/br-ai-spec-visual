import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { listInstallations } from "@/lib/services/installations-query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireApiRole("admin");
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
  const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);

  const result = await listInstallations({
    query,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return NextResponse.json(result);
}
