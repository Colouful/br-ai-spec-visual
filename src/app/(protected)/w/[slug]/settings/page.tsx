import { notFound } from "next/navigation";

import { WorkspaceConnectCard } from "@/components/workspaces/workspace-connect-card";
import { WorkspaceOnboardingCard } from "@/components/workspaces/workspace-onboarding-card";
import { getWorkspaceDetailVm } from "@/lib/view-models/workspaces";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

import { WorkspacePipelineHints } from "../_components/workspace-pipeline-hints";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) {
    notFound();
  }
  const viewModel = await getWorkspaceDetailVm(workspace.id);
  if (!viewModel) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <WorkspaceOnboardingCard
          workspaceSlug={workspace.slug}
          onboarding={viewModel.onboarding}
        />
        <WorkspaceConnectCard
          workspaceId={workspace.id}
          workspaceSlug={workspace.slug}
          workspaceName={workspace.name}
          rootPath={viewModel.onboarding.workspaceRootPath}
        />
      </div>
      <WorkspacePipelineHints workspaceSlug={slug} />
    </div>
  );
}
