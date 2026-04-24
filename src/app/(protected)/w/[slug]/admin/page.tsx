import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { WorkspaceGovernanceDashboard } from "@/components/governance/open-spec-governance-dashboard";
import { getWorkspaceGovernanceViewModel } from "@/lib/view-models/governance";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceGovernancePage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const summary = await getWorkspaceGovernanceViewModel({
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
    rootPath: workspace.rootPath,
  });

  return (
    <ConsolePage hero={summary.hero}>
      <WorkspaceGovernanceDashboard summary={summary} />
    </ConsolePage>
  );
}
