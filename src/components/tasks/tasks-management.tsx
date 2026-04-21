import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { TasksPageVm } from "@/lib/view-models/tasks";

export function TasksManagement({ viewModel }: { viewModel: TasksPageVm }) {
  return (
    <Panel title="任务列表" eyebrow="按任务管理">
      <div className="space-y-3">
        {viewModel.rows.map((row) => (
          <Link
            key={row.id}
            href={row.linkHref}
            className="block rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-white">{row.title}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {row.kindLabel} · {row.workspaceName} · {row.updatedAt}
                </p>
              </div>
              <StatusBadge badge={row.status} compact />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{row.summary}</p>
            <p className="mt-3 text-sm text-slate-400">负责人：{row.owner} · 标识：{row.meta}</p>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
