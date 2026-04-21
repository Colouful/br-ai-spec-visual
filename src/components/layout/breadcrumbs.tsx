"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const LABELS: Record<string, string> = {
  overview: "总览",
  workspaces: "工作区",
  specs: "规范资产",
  tasks: "执行看板",
  runs: "运行记录",
  changes: "变更流水",
  topology: "拓扑图谱",
  members: "成员管理",
  settings: "系统设置",
  board: "看板",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const items = useMemo(() => {
    const segs = pathname.split("/").filter(Boolean);
    return segs.map((seg, idx) => ({
      href: "/" + segs.slice(0, idx + 1).join("/"),
      label: LABELS[seg] ?? decodeURIComponent(seg).slice(0, 14),
    }));
  }, [pathname]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="面包屑"
      className="flex flex-wrap items-center gap-1 text-xs text-slate-400"
    >
      <Link
        href="/overview"
        className="transition hover:text-slate-200"
      >
        控制台
      </Link>
      {items.map((it, idx) => (
        <span key={it.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-slate-600" />
          {idx === items.length - 1 ? (
            <span className="text-slate-200">{it.label}</span>
          ) : (
            <Link href={it.href} className="transition hover:text-slate-200">
              {it.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
