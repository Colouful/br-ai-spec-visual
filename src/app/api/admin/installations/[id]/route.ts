import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { getInstallationDetail } from "@/lib/services/installations-query";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiRole("admin");
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const detail = await getInstallationDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
