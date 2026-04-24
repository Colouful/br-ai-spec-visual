import { notFound } from "next/navigation";

import { CurrentExpertWorkspace } from "@/components/current-workspace/current-expert-workspace";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { getCurrentUser } from "@/lib/auth/server";
import { canOperateControl } from "@/lib/permissions/permissions";
import { getCurrentWorkspaceViewModel } from "@/lib/view-models/current-workspace";
import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceRootPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  if (!workspace) notFound();

  const user = await getCurrentUser();
  const viewModel = await getCurrentWorkspaceViewModel({
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      rootPath: workspace.rootPath,
    },
    userCanApprove: canOperateControl(user?.role ?? "viewer"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RealtimeWorkspaceBridge
          label="工作台订阅"
          workspaceIds={[workspace.id]}
        />
      </div>
      <CurrentExpertWorkspace
        key={`${viewModel.workspaceId}:${viewModel.flow.runId}:${viewModel.drawer.defaultNodeId ?? "none"}`}
        viewModel={viewModel}
      />
    </div>
  );
}
