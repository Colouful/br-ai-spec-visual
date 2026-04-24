import Link from "next/link";

import { ConsolePage } from "@/components/dashboard/console-page";
import { PlatformCockpit } from "@/components/dashboard/platform-cockpit";
import { getDashboardVm } from "@/lib/view-models/dashboard";

export default async function OverviewPage() {
  const viewModel = await getDashboardVm();

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={
        <>
          <Link
            href="/workspaces"
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
          >
            查看工作区
          </Link>
          <Link
            href="/route-decision"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
          >
            变更分流决策
          </Link>
          {viewModel.defaultWorkspaceSlug ? (
            <Link
              href={`/w/${encodeURIComponent(viewModel.defaultWorkspaceSlug)}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
            >
              打开默认工作台
            </Link>
          ) : null}
        </>
      }
    >
      <PlatformCockpit viewModel={viewModel} />
    </ConsolePage>
  );
}
