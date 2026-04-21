import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { ChangeDetailVm } from "@/lib/view-models/changes";

export function ChangeDetail({ viewModel }: { viewModel: ChangeDetailVm }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <Panel title="检查清单" eyebrow="控制项">
          <div className="space-y-3">
            {viewModel.change.checklist.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="时间线" eyebrow="评审轨迹">
          <div className="space-y-3">
            {viewModel.change.timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium text-white">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.note}</p>
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    {item.at}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="变更概况" eyebrow={viewModel.change.workspaceName}>
        <div className="space-y-4">
          <StatusBadge badge={viewModel.change.status} />
          <p className="text-sm leading-7 text-slate-300">{viewModel.change.summary}</p>
          <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              负责人
            </p>
            <p className="mt-2 text-sm text-white">{viewModel.change.owner}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              评审人
            </p>
            <p className="mt-2 text-sm text-white">{viewModel.change.reviewers.join(" · ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {viewModel.change.systems.map((system) => (
              <span
                key={system}
                className="rounded-full border border-white/8 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300"
              >
                {system}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/workspaces/${viewModel.change.workspaceId}`}
              className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-300/14"
            >
              打开工作区
            </Link>
            {viewModel.change.runIds[0] ? (
              <Link
                href={`/runs/${viewModel.change.runIds[0]}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/6"
              >
                关联运行
              </Link>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}
