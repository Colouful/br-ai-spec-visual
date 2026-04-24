import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { SpecsPageVm } from "@/lib/view-models/specs";

export function SpecsManagement({ viewModel }: { viewModel: SpecsPageVm }) {
  return (
    <Panel title="文档列表" eyebrow="按规范管理">
      <div className="space-y-3">
        {viewModel.rows.map((row) => (
          <div
            key={`${row.id}:${row.sourcePath}`}
            className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-white">{row.title}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {row.workspaceName} · {row.docType} · {row.updatedAt}
                </p>
              </div>
              <StatusBadge badge={row.status} compact />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{row.summary}</p>
            <p className="mt-3 font-mono text-xs text-slate-500">{row.sourcePath}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
