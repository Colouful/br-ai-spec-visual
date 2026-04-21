import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsolePage } from "@/components/dashboard/console-page";
import { Panel } from "@/components/dashboard/panel";
import { BarList, Donut } from "@/components/admin/installations/charts";
import { getInstallationDetail } from "@/lib/services/installations-query";

export const dynamic = "force-dynamic";

export default async function InstallationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getInstallationDetail(decodeURIComponent(id));
  if (!detail) {
    notFound();
  }

  const { installation, events, projects, commandStats } = detail;

  const commandCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  for (const stat of commandStats) {
    commandCounts.set(stat.command, (commandCounts.get(stat.command) ?? 0) + stat.count);
    statusCounts.set(stat.status, (statusCounts.get(stat.status) ?? 0) + stat.count);
  }

  return (
    <ConsolePage
      hero={{
        eyebrow: "Installation",
        title: installation.hostname ?? installation.installationId,
        subtitle: `机器 ID: ${installation.installationId}`,
        stats: [
          { label: "总事件", value: String(installation.totalEvents) },
          { label: "项目数", value: String(projects.length) },
          {
            label: "首次上报",
            value: new Date(installation.firstSeenAt).toLocaleDateString("zh-CN"),
          },
          {
            label: "最近上报",
            value: new Date(installation.lastSeenAt).toLocaleString("zh-CN"),
          },
        ],
      }}
    >
      <div className="mb-2">
        <Link
          href="/admin/installations"
          className="text-xs text-cyan-300/80 hover:text-cyan-200"
        >
          ← 返回列表
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel eyebrow="Profile" title="基础信息">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <Info label="用户名" value={installation.username} />
            <Info label="系统" value={installation.platform} />
            <Info label="架构" value={installation.arch} />
            <Info label="OS Release" value={installation.osRelease} />
            <Info label="Node.js" value={installation.nodeVersion} />
            <Info label="最近 CLI" value={installation.lastCliVersion} />
            <Info label="最近命令" value={installation.lastCommand} />
            <Info label="Installation ID" value={installation.installationId} mono />
          </dl>
        </Panel>
        <Panel eyebrow="Status" title="命令状态分布">
          <Donut
            items={Array.from(statusCounts.entries()).map(([label, value]) => ({
              label,
              value,
            }))}
          />
        </Panel>

        <Panel eyebrow="Commands" title="命令调用频次">
          <BarList
            items={Array.from(commandCounts.entries())
              .map(([label, value]) => ({ label, value }))
              .sort((a, b) => b.value - a.value)}
          />
        </Panel>

        <Panel eyebrow="Projects" title={`项目列表 · ${projects.length}`}>
          {projects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
              该机器尚未关联任何项目
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-100">
                      {project.projectName ?? "未命名项目"}
                    </p>
                    <p className="font-mono text-[10px] text-white/40">
                      {project.projectHash.slice(0, 16)}… · {project.profile ?? "—"}
                    </p>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <p className="text-cyan-200">{project.eventCount} 次</p>
                    <p className="text-white/40">
                      {new Date(project.lastSeenAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Timeline" title={`近 ${events.length} 条事件`} className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                <th className="px-3 py-2">时间</th>
                <th className="px-3 py-2">命令</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">耗时</th>
                <th className="px-3 py-2">CLI</th>
                <th className="px-3 py-2">Profile</th>
                <th className="px-3 py-2">项目</th>
                <th className="px-3 py-2">错误</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-white/40">
                    尚无事件
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-t border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2 font-mono text-white/70">
                      {new Date(event.occurredAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-100">
                      {event.command}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          event.status === "success"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : event.status === "failed"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-white/10 text-white/60"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-white/60">
                      {event.durationMs != null ? `${event.durationMs} ms` : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-emerald-300/80">
                      {event.cliVersion ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {event.profile ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {event.projectName ?? (event.projectHash?.slice(0, 10) ?? "—")}
                    </td>
                    <td className="px-3 py-2 max-w-[240px] truncate text-rose-300/80">
                      {event.errorMessage ?? ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </ConsolePage>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
        {label}
      </dt>
      <dd
        className={`mt-1 text-slate-100 ${mono ? "font-mono text-[11px] break-all" : ""}`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
