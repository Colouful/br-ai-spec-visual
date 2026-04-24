import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { getGovernanceSummaryViewModel } from "@/lib/view-models/governance";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireApiRole("admin");
  if ("response" in guard) return guard.response;

  const summary = await getGovernanceSummaryViewModel();
  return NextResponse.json(summary);
}
