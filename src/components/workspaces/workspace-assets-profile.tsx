import { ConsolePage } from "@/components/dashboard/console-page";
import type { HubLockProfile } from "@/lib/hub-lock-profile";

export function WorkspaceAssetsProfile({
  workspaceName,
  profile,
}: {
  workspaceName: string;
  profile: HubLockProfile;
}) {
  return (
    <ConsolePage
      hero={{
        eyebrow: workspaceName,
        title: "项目资产画像",
        subtitle: "基于 hub-lock.json 展示项目当前 Manifest、资产版本、本地改动和高风险资产。",
        stats: [
          { label: "Manifest", value: profile.manifestId || "未检测" },
          { label: "版本", value: profile.manifestVersion || "-" },
          { label: "资产数", value: String(profile.assetCount) },
          { label: "高风险", value: String(profile.highRiskAssets.length) },
        ],
      }}
    >
      <div className="space-y-6">
        {!profile.detected ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
            暂无数据。请先在项目中执行 ai-spec-auto hub install，生成 hub-lock.json。
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <Metric label="安装模式" value={profile.mode || "-"} />
              <Metric label="最近同步时间" value={profile.installedAt || "-"} />
              <Metric label="本地改动" value={String(profile.localChangedAssets.length)} />
              <Metric label="锁文件" value={profile.sourcePath || "-"} />
            </section>
            <section className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-slate-300">
                  <tr>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">资产 ID</th>
                    <th className="px-4 py-3">版本</th>
                    <th className="px-4 py-3">风险</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">安装路径</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.assets.map((asset) => {
                    const changed = profile.localChangedAssets.some(
                      (item) => item.kind === asset.kind && item.assetId === asset.assetId,
                    );
                    return (
                      <tr key={`${asset.kind}:${asset.assetId}`} className="border-t border-white/10">
                        <td className="px-4 py-3">{asset.kind}</td>
                        <td className="px-4 py-3 font-mono">{asset.assetId}</td>
                        <td className="px-4 py-3">{asset.version}</td>
                        <td className="px-4 py-3">{asset.riskLevel || "L0"}</td>
                        <td className="px-4 py-3">{changed ? "checksum 异常" : "正常"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{asset.installPath || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </ConsolePage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}
