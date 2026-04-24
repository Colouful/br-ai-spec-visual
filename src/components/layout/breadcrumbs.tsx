"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  overview: "总览",
  workspaces: "工作区",
  specs: "规范",
  tasks: "执行看板",
  runs: "运行",
  changes: "变更",
  topology: "拓扑",
  members: "成员",
  settings: "设置",
  board: "看板",
  pipeline: "流水线",
  admin: "治理",
  platform: "平台",
  installations: "用户安装使用",
  "route-decision": "分流决策",
  w: "工作区",
};

interface BreadcrumbsProps {
  workspaceLabelMap?: Record<string, string>;
}

export function Breadcrumbs({ workspaceLabelMap = {} }: BreadcrumbsProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    const segs = pathname.split("/").filter(Boolean);
    if (segs.length === 0) return [] as Array<{ href: string; label: string }>;

    if (segs[0] === "w" && segs.length >= 2) {
      const slug = segs[1];
      const decoded = (() => {
        try {
          return decodeURIComponent(slug);
        } catch {
          return slug;
        }
      })();
      const root = `/w/${slug}`;
      const rootLabel = workspaceLabelMap[decoded] ?? decoded;
      const result: Array<{ href: string; label: string }> = [
        { href: root, label: rootLabel },
      ];
      for (let i = 2; i < segs.length; i++) {
        const seg = segs[i];
        const href = "/" + segs.slice(0, i + 1).join("/");
        result.push({
          href,
          label: SEGMENT_LABELS[seg] ?? decodeURIComponent(seg).slice(0, 18),
        });
      }
      return result;
    }

    return segs.map((seg, idx) => ({
      href: "/" + segs.slice(0, idx + 1).join("/"),
      label: SEGMENT_LABELS[seg] ?? decodeURIComponent(seg).slice(0, 18),
    }));
  }, [pathname, workspaceLabelMap]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="面包屑"
      className="flex flex-wrap items-center gap-1 text-xs text-slate-400"
    >
      <Link href="/workspaces" className="transition hover:text-slate-200">
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
