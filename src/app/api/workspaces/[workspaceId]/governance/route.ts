import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { getWorkspaceGovernanceViewModel } from "@/lib/view-models/governance";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const guard = await requireApiRole("admin");
  if ("response" in guard) return guard.response;

  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceBySlugOrId(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: "workspace not found" }, { status: 404 });
  }

  const summary = await getWorkspaceGovernanceViewModel({
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
    rootPath: workspace.rootPath,
  });
  return NextResponse.json(summary);
}
