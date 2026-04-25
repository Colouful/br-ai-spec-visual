import { notFound } from "next/navigation";
import { WorkspaceRuntimeInsights } from "@/components/workspaces/workspace-runtime-insights";
import { buildRuntimeInsightsFromHubLock, readHubLockProfile } from "@/lib/hub-lock-profile";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export default async function WorkspaceRuntimeInsightsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const profile = readHubLockProfile(workspace.rootPath);
  const insights = buildRuntimeInsightsFromHubLock({
    projectPath: workspace.rootPath,
    profile,
  });

  return (
    <WorkspaceRuntimeInsights
      workspaceName={workspace.name}
      profile={profile}
      insights={insights}
    />
  );
}
