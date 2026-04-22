import { notFound } from "next/navigation";

import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
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
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RealtimeWorkspaceBridge
          label="流水线订阅"
          workspaceIds={[workspace.id]}
        />
      </div>
      <PipelineBoard workspaceName={workspace.name} vm={vm} />
    </div>
  );
}
