import { notFound } from "next/navigation";
import { WorkspaceAssetsProfile } from "@/components/workspaces/workspace-assets-profile";
import { readHubLockProfile } from "@/lib/hub-lock-profile";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export default async function WorkspaceSlugAssetsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  return (
    <WorkspaceAssetsProfile
      workspaceName={workspace.name}
      profile={readHubLockProfile(workspace.rootPath)}
    />
  );
}
