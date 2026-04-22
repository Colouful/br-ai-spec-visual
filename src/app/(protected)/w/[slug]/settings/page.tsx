import { findWorkspaceBySlugOrId } from "@/lib/workspace-context/server";

import { WorkspacePipelineHints } from "../_components/workspace-pipeline-hints";
import { WorkspacePlaceholder } from "../_components/workspace-placeholder";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const workspace = await findWorkspaceBySlugOrId(slug);
  return (
    <div className="space-y-8">
      <WorkspacePlaceholder
        eyebrow={workspace?.name ?? slug}
        title="工作区设置"
        description="本工作区的连接、同步策略、默认成员角色等配置。系统级设置仍在「平台 / 系统设置」。"
        legacyHref="/settings"
        upcoming={[
          "在上下文中展示本项目产物与流程、与五阶段流水线配合",
          "与全局视图保持数据一致，但去除跨工作区噪音",
          "见下方「数据与看板」了解运行记录与清理策略",
        ]}
      />
      <WorkspacePipelineHints workspaceSlug={slug} />
    </div>
  );
}
