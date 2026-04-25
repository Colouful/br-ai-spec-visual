import { ConsolePage } from "@/components/dashboard/console-page";
import type { HubLockProfile, HubRuntimeInsights } from "@/lib/hub-lock-profile";

export function WorkspaceRuntimeInsights({
  workspaceName,
  profile,
  insights,
}: {
  workspaceName: string;
  profile: HubLockProfile;
  insights: HubRuntimeInsights;
}) {
  return (
    <ConsolePage
      hero={{
        eyebrow: `${workspaceName} · 运行洞察`,
        title: insights.title,
        subtitle: insights.summary,
        stats: [
          { label: "健康状态", value: healthLabel(insights.health) },
          { label: "Manifest", value: profile.manifestId || "未检测" },
          { label: "资产数", value: String(profile.assetCount) },
          { label: "高风险", value: String(profile.highRiskAssets.length) },
        ],
      }}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          {insights.riskSignals.map((signal) => (
            <div key={signal.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-slate-400">{signal.label}</div>
              <div className={["mt-2 text-2xl font-semibold", signalColor(signal.severity)].join(" ")}>
                {signal.value}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm font-semibold text-slate-100">下一步动作</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{insights.nextAction}</p>
          {insights.runtimeReportCommand ? (
            <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-black/30 p-3 text-xs text-cyan-100">
              {insights.runtimeReportCommand}
            </pre>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-left text-slate-300">
              <tr>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">资产 ID</th>
                <th className="px-4 py-3">版本</th>
                <th className="px-4 py-3">运行风险</th>
              </tr>
            </thead>
            <tbody>
              {profile.assets.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                    暂无资产数据
                  </td>
                </tr>
              ) : (
                profile.assets.map((asset) => {
                  const changed = profile.localChangedAssets.some(
                    (item) => item.kind === asset.kind && item.assetId === asset.assetId,
                  );
                  const risky = asset.riskLevel === "L3" || asset.riskLevel === "L4";
                  return (
                    <tr key={`${asset.kind}:${asset.assetId}`} className="border-t border-white/10">
                      <td className="px-4 py-3">{asset.kind}</td>
                      <td className="px-4 py-3 font-mono">{asset.assetId}</td>
                      <td className="px-4 py-3">{asset.version || "-"}</td>
                      <td className="px-4 py-3">{risky ? "高风险" : changed ? "本地改动" : "可回流"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </ConsolePage>
  );
}

function healthLabel(health: HubRuntimeInsights["health"]) {
  const labels = {
    missing: "未接入",
    healthy: "健康",
    warning: "需确认",
    blocked: "阻塞",
  };
  return labels[health];
}

function signalColor(severity: "info" | "warning" | "blocked") {
  if (severity === "blocked") return "text-rose-300";
  if (severity === "warning") return "text-amber-300";
  return "text-slate-100";
}
