import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { getCurrentWorkspaceViewModel } from "@/lib/view-models/current-workspace";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const guard = await requireApiRole("viewer");
  if ("response" in guard) return guard.response;

  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceBySlugOrId(workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: "workspace not found" }, { status: 404 });
  }

  const summary = await getCurrentWorkspaceViewModel({
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      rootPath: workspace.rootPath,
    },
    userCanApprove: guard.user.role === "admin" || guard.user.role === "maintainer",
  });

  return NextResponse.json(summary);
}
