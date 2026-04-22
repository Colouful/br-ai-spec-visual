"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/dashboard/panel";
import { BarList, Donut, LineChart, PulseDot } from "./charts";
import type {
  InstallationListItem,
  InstallationsStats,
} from "@/lib/services/installations-query";

type Tab = "list" | "trends" | "adoption" | "realtime";

interface DashboardProps {
  stats: InstallationsStats;
  initialList: { items: InstallationListItem[]; total: number };
}

interface ActiveEntry {
  installationId: string;
  hostname: string | null;
  username: string | null;
  lastCommand: string | null;
  lastStatus: string | null;
  lastSeenAt: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))} 秒前`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

export function InstallationsDashboard({ stats, initialList }: DashboardProps) {
  const [tab, setTab] = useState<Tab>("list");
  const [query, setQuery] = useState("");
  const filteredList = useMemo(() => {
    if (!query.trim()) return initialList.items;
    const q = query.toLowerCase();
    return initialList.items.filter((item) =>
      [item.installationId, item.hostname, item.username, item.platform]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [initialList.items, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["list", "用户列表"],
            ["trends", "趋势报表"],
            ["adoption", "项目接入"],
            ["realtime", "实时活跃"],
          ] as Array<[Tab, string]>
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === "list" ? (
        <Panel
          eyebrow="Users"
          title={`安装用户列表 · 共 ${initialList.total}`}
          aside={
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索机器 / 用户名 / 主机名"
              className="w-64 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-400/40 focus:outline-none"
            />
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  <th className="px-3 py-2">机器</th>
                  <th className="px-3 py-2">用户</th>
                  <th className="px-3 py-2">系统</th>
                  <th className="px-3 py-2">CLI</th>
                  <th className="px-3 py-2">最近命令</th>
                  <th className="px-3 py-2 text-right">事件</th>
                  <th className="px-3 py-2 text-right">项目</th>
                  <th className="px-3 py-2">首次</th>
                  <th className="px-3 py-2">最近</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-sm text-white/40">
                      {query ? "没有匹配到记录" : "尚未收到任何遥测上报"}
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-cyan-200">
                        <Link
                          href={`/platform/installations/${encodeURIComponent(item.installationId)}`}
                          className="hover:underline"
                        >
                          {item.hostname || item.installationId.slice(0, 12)}
                        </Link>
                        <div className="text-[10px] text-white/40">
                          {item.installationId.slice(0, 18)}…
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-200">{item.username ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-300">
                        {item.platform ?? "—"}
                        {item.osRelease ? (
                          <span className="ml-1 text-white/40">{item.osRelease}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 font-mono text-emerald-300/80">
                        {item.lastCliVersion ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-200">
                        {item.lastCommand ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-200">
                        {item.totalEvents}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-200">
                        {item.projectCount}
                      </td>
                      <td className="px-3 py-2 text-white/60">
                        {formatRelative(item.firstSeenAt)}
                      </td>
                      <td className="px-3 py-2 text-white/80">
                        {formatRelative(item.lastSeenAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {tab === "trends" ? <TrendsTab stats={stats} /> : null}
      {tab === "adoption" ? <AdoptionTab stats={stats} /> : null}
      {tab === "realtime" ? <RealtimeTab /> : null}
    </div>
  );
}

function TrendsTab({ stats }: { stats: InstallationsStats }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel eyebrow="Daily active" title="近 30 天活跃 Installation">
        <LineChart
          points={stats.dailyActive.map((point) => ({
            x: point.date.slice(5),
            y: point.installations,
          }))}
        />
      </Panel>
      <Panel eyebrow="Daily events" title="近 30 天命令调用量">
        <LineChart
          points={stats.dailyActive.map((point) => ({
            x: point.date.slice(5),
            y: point.events,
          }))}
        />
      </Panel>
      <Panel eyebrow="Commands" title="命令使用分布">
        <BarList
          items={stats.commandDistribution.map((item) => ({
            label: item.command,
            value: item.count,
          }))}
        />
      </Panel>
      <Panel eyebrow="Status" title="命令执行状态">
        <Donut
          items={stats.statusDistribution.map((item) => ({
            label: item.status,
            value: item.count,
          }))}
        />
      </Panel>
      <Panel eyebrow="Platform" title="操作系统分布">
        <Donut
          items={stats.platformDistribution.map((item) => ({
            label: item.platform,
            value: item.count,
          }))}
        />
      </Panel>
      <Panel eyebrow="CLI version" title="CLI 版本渗透率">
        <BarList
          items={stats.cliVersionDistribution.map((item) => ({
            label: item.cliVersion,
            value: item.count,
          }))}
        />
      </Panel>
    </div>
  );
}

function AdoptionTab({ stats }: { stats: InstallationsStats }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel eyebrow="Projects" title="项目接入总览">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="累计项目" value={stats.totalProjects} />
          <Stat label="近 7 天新增" value={stats.newProjectsLast7d} accent="emerald" />
          <Stat label="近 30 天新增" value={stats.newProjectsLast30d} accent="cyan" />
        </div>
      </Panel>
      <Panel eyebrow="Profile" title="技术栈 Profile 分布">
        <Donut
          items={stats.profileDistribution.map((item) => ({
            label: item.profile,
            value: item.count,
          }))}
        />
      </Panel>
      <Panel eyebrow="Events" title="全部事件统计" className="xl:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="累计安装" value={stats.totalInstallations} />
          <Stat label="累计事件" value={stats.totalEvents} />
          <Stat label="MAU" value={stats.mau} accent="cyan" />
          <Stat label="今日事件" value={stats.eventsToday} accent="emerald" />
        </div>
      </Panel>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "cyan" | "emerald";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "cyan"
        ? "text-cyan-300"
        : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function RealtimeTab() {
  const [items, setItems] = useState<ActiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/admin/installations/active", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as { items: ActiveEntry[] };
        if (!cancelled) setItems(body.items);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    timer = setInterval(load, 5_000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <Panel
      eyebrow="Live"
      title="最近 2 分钟活跃 Installation"
      aside={
        <span className="flex items-center gap-2 text-[11px] text-emerald-300/80">
          <PulseDot /> 每 5 秒自动刷新
        </span>
      }
    >
      {loading ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-white/50">
          正在加载活跃列表…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-white/50">
          当前没有活跃 CLI 会话
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.installationId}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <PulseDot />
                <div>
                  <p className="font-mono text-cyan-200">
                    {item.hostname ?? item.installationId.slice(0, 12)}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {item.installationId.slice(0, 18)}… · {item.username ?? "anonymous"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-slate-200">
                  {item.lastCommand ?? "—"}
                  {item.lastStatus ? (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                        item.lastStatus === "success"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : item.lastStatus === "failed"
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {item.lastStatus}
                    </span>
                  ) : null}
                </p>
                <p className="text-[10px] text-white/50">
                  {formatRelative(item.lastSeenAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
