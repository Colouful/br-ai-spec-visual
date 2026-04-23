import Link from "next/link";

import { ConsolePage } from "@/components/dashboard/console-page";
import { RouteDecisionStudio } from "@/components/route-decision/route-decision-studio";
import { getRouteDecisionPageVm } from "@/lib/view-models/route-decision";

interface RouteDecisionPageProps {
  searchParams: Promise<{ workspace?: string | string[] }>;
}

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RouteDecisionPage({
  searchParams,
}: RouteDecisionPageProps) {
  const params = await searchParams;
  const viewModel = await getRouteDecisionPageVm();
  const initialWorkspace = pickParam(params.workspace);

  return (
    <ConsolePage
      hero={{
        eyebrow: "Route Decision 分流决策器",
        title: "先选对流转路径，再开始改代码",
        subtitle:
          "把 quick-fix(轻量快修)、patch(补丁修正)、scope-delta(范围增量)、archive-fix(归档前修正)、followup-patch(归档后补丁)、full-change(完整变更) 这些语义收敛成一张决策工作台。",
        stats: [
          { label: "工作区", value: String(viewModel.workspaces.length) },
          {
            label: "默认工作区",
            value: viewModel.defaultWorkspaceSlug ?? "未选择",
          },
          {
            label: "有 open change 的工作区",
            value: String(
              viewModel.workspaces.filter((workspace) => workspace.openChangeCount > 0).length,
            ),
          },
          {
            label: "有归档记录的工作区",
            value: String(
              viewModel.workspaces.filter((workspace) => workspace.archivedChangeCount > 0).length,
            ),
          },
        ],
      }}
      actions={
        <>
          <Link
            href="/overview"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
          >
            返回驾驶舱
          </Link>
          <Link
            href="/workspaces"
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
          >
            查看工作区
          </Link>
        </>
      }
    >
      <RouteDecisionStudio
        viewModel={viewModel}
        initialWorkspace={initialWorkspace}
      />
    </ConsolePage>
  );
}
