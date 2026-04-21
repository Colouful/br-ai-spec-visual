import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import type { MembersPageVm } from "@/lib/view-models/members";

export function MembersManagement({ viewModel }: { viewModel: MembersPageVm }) {
  return (
    <Panel title="成员列表" eyebrow="按人管理">
      <div className="space-y-3">
        {viewModel.rows.map((row) => (
          <div key={row.id} className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-white">{row.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {row.roleLabel} · {row.email}
                </p>
              </div>
              <p className="text-sm text-slate-300">最近活动：{row.lastActivity}</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[18px] border border-white/6 bg-black/20 px-3 py-3 text-sm text-slate-200">
                管理工作区：{row.workspaceCount}
              </div>
              <div className="rounded-[18px] border border-white/6 bg-black/20 px-3 py-3 text-sm text-slate-200">
                活跃会话：{row.sessionCount}
              </div>
              <div className="rounded-[18px] border border-white/6 bg-black/20 px-3 py-3 text-sm text-slate-200">
                工作区：{row.workspaces.map((workspace) => workspace.name).join(" · ") || "暂无"}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {row.workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspaces/${workspace.id}`}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/6"
                >
                  {workspace.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
