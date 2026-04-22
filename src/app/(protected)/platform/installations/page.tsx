import { ConsolePage } from "@/components/dashboard/console-page";
import { Panel } from "@/components/dashboard/panel";
import { InstallationsDashboard } from "@/components/admin/installations/dashboard";
import {
  getInstallationsStats,
  listInstallations,
} from "@/lib/services/installations-query";

export const dynamic = "force-dynamic";

export default async function InstallationsAdminPage() {
  const [stats, list] = await Promise.all([
    getInstallationsStats(),
    listInstallations({ limit: 50 }),
  ]);

  return (
    <ConsolePage
      hero={{
        eyebrow: "平台管理",
        title: "用户安装使用 · 命令行遥测总览",
        subtitle:
          "以机器级唯一标识聚合 ai-spec-auto 的 init / update / sync / check / uninstall 调用，实时掌握装机量、活跃度、命令分布与接入趋势。",
        stats: [
          { label: "总安装数", value: String(stats.totalInstallations) },
          { label: "日活", value: String(stats.dau) },
          { label: "周活", value: String(stats.wau) },
          { label: "月活", value: String(stats.mau) },
          { label: "今日命令", value: String(stats.eventsToday) },
          { label: "总项目", value: String(stats.totalProjects) },
        ],
      }}
    >
      <InstallationsDashboard stats={stats} initialList={list} />
      <Panel eyebrow="说明" title="数据来源">
        <p className="text-sm leading-7 text-slate-300/90">
          数据来源于 <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">@ex/ai-spec-auto</code>
          CLI 通过 <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">AI_SPEC_VISUAL_URL</code> 的匿名遥测上报。
          每台机器对应一个安装实例，唯一标识来自 <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">node-machine-id</code>（缺失时用
          MAC+用户+主机名的 SHA-256 兜底）。项目路径以哈希形式上报，不包含原始路径或仓库内容。
        </p>
      </Panel>
    </ConsolePage>
  );
}
