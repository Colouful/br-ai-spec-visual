import { Panel } from "@/components/dashboard/panel";
import type { SettingsPageVm } from "@/lib/view-models/settings";

export function SettingsSkeleton({ viewModel }: { viewModel: SettingsPageVm }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {viewModel.sections.map((section) => (
        <Panel key={section.id} title={section.title} eyebrow={section.summary}>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-medium text-white">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                  <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300">
                    {item.mode}
                  </span>
                </div>
                <div className="mt-4 rounded-[18px] border border-cyan-400/10 bg-cyan-400/6 px-3 py-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan-50">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
