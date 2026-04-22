import Link from "next/link";

import { Panel } from "@/components/dashboard/panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { FilePreviewButton } from "@/components/changes/file-preview-dialog";
import type { ChangeDetailVm } from "@/lib/view-models/changes";

export function ChangeDetail({ viewModel }: { viewModel: ChangeDetailVm }) {
  const { change } = viewModel;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <Panel title="检查清单" eyebrow="控制项">
          <div className="space-y-3">
            {change.checklist.length === 0 ? (
              <EmptyState text="暂无检查项" />
            ) : (
              change.checklist.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="group flex items-start justify-between gap-3 rounded-[20px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileIcon />
                    <p className="min-w-0 break-all font-mono text-[12.5px] leading-6 text-slate-100">
                      {item.label}
                    </p>
                  </div>
                  {item.filePath ? (
                    <FilePreviewButton changeId={change.id} filePath={item.filePath} />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="时间线" eyebrow="评审轨迹">
          <ol className="relative space-y-4 border-l border-white/10 pl-5">
            {change.timeline.map((item, index) => (
              <li key={item.id ?? `${item.label}-${index}`} className="relative">
                <span className="absolute -left-[26px] top-1.5 flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.55)]" />
                </span>
                <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-cyan-300/25 hover:bg-white/6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-white">{item.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.note}</p>
                    </div>
                    <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      {item.at}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="变更概况" eyebrow={change.workspaceName}>
        <div className="space-y-4">
          <StatusBadge badge={change.status} />
          <p className="text-sm leading-7 text-slate-300">{change.summary}</p>

          <InfoField label="负责人">{change.owner}</InfoField>

          <InfoField label="评审人">
            {change.reviewers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {change.reviewers.map((reviewer) => (
                  <span
                    key={reviewer}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-100"
                  >
                    {reviewer}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400">暂无</span>
            )}
          </InfoField>

          {change.systems.length > 0 ? (
            <InfoField label="关联标签">
              <div className="flex flex-wrap gap-2">
                {change.systems.map((system) => (
                  <span
                    key={system}
                    className="rounded-full border border-white/8 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300"
                  >
                    {system}
                  </span>
                ))}
              </div>
            </InfoField>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={`/w/${encodeURIComponent(change.workspaceSlug)}/pipeline`}
              className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/50 hover:bg-cyan-300/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              打开工作区
            </Link>
            {change.sourcePath ? (
              <FilePreviewButton
                changeId={change.id}
                filePath={change.sourcePath}
                label="预览源文件"
              />
            ) : null}
            {change.runIds[0] ? (
              <Link
                href={`/runs/${change.runIds[0]}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/8"
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

function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-white/14">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-sm text-white">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/10 bg-white/2 px-4 py-6 text-center text-xs text-slate-500">
      {text}
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80"
      aria-hidden
    >
      <path d="M5 2.5h6.5L15 6v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 17V4a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M11 2.5V6h4" />
      <path d="M7.5 11h5M7.5 14h5" />
    </svg>
  );
}
