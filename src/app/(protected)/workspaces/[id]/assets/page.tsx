import { notFound } from "next/navigation";
import { WorkspaceAssetsProfile } from "@/components/workspaces/workspace-assets-profile";
import { readHubLockProfile } from "@/lib/hub-lock-profile";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

export default async function WorkspaceAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await findWorkspaceBySlugOrId(id);
  if (!workspace) notFound();

  const profile = readHubLockProfile(workspace.rootPath);

  return <WorkspaceAssetsProfile workspaceName={workspace.name} profile={profile} />;
}
