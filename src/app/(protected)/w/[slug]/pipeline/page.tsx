import { notFound } from "next/navigation";

import { getWorkspacePipelineVm } from "@/lib/view-models/pipeline-loader";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

import { PipelineBoard } from "./_components/pipeline-board";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspacePipelinePage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) {
    notFound();
  }
  const vm = await getWorkspacePipelineVm(workspace.id, workspace.slug);
  return <PipelineBoard workspaceName={workspace.name} vm={vm} />;
}
