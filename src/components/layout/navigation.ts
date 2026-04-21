import type { UserRole } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

export type NavigationIcon =
  | "layout-dashboard"
  | "file-stack"
  | "list-todo"
  | "activity"
  | "users"
  | "settings"
  | "folders"
  | "git-branch"
  | "network"
  | "bar-chart";

export interface NavigationItem {
  href: string;
  icon: NavigationIcon;
  label: string;
  requiredRole: UserRole;
  summary: string;
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}

const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: "workbench",
    label: "工作台",
    items: [
      {
        href: "/overview",
        icon: "layout-dashboard",
        label: "总览",
        requiredRole: "viewer",
        summary: "全工作区健康卡 + 活跃运行心跳 + 归档时间线",
      },
      {
        href: "/workspaces",
        icon: "folders",
        label: "工作区",
        requiredRole: "viewer",
        summary: "多项目纳管与连接配置",
      },
      {
        href: "/specs",
        icon: "file-stack",
        label: "规范资产",
        requiredRole: "viewer",
        summary: "管理提案、规范与交付上下文",
      },
      {
        href: "/tasks",
        icon: "list-todo",
        label: "执行看板",
        requiredRole: "maintainer",
        summary: "跟踪任务编排、状态和回归范围",
      },
      {
        href: "/runs",
        icon: "activity",
        label: "运行记录",
        requiredRole: "maintainer",
        summary: "审阅自动化执行与异常历史",
      },
      {
        href: "/changes",
        icon: "git-branch",
        label: "变更流水",
        requiredRole: "maintainer",
        summary: "跟踪变更文档与状态流转",
      },
      {
        href: "/topology",
        icon: "network",
        label: "拓扑图谱",
        requiredRole: "viewer",
        summary: "仓库与规范资产关系可视化",
      },
    ],
  },
  {
    id: "governance",
    label: "治理",
    items: [
      {
        href: "/members",
        icon: "users",
        label: "成员管理",
        requiredRole: "admin",
        summary: "分配角色、维护账号策略",
      },
      {
        href: "/admin/installations",
        icon: "bar-chart",
        label: "用户安装使用",
        requiredRole: "admin",
        summary: "CLI 安装用户、命令使用与趋势",
      },
      {
        href: "/settings",
        icon: "settings",
        label: "系统设置",
        requiredRole: "admin",
        summary: "配置认证策略与默认权限",
      },
    ],
  },
];

export function getNavigationSections(role: UserRole) {
  return NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(role, item.requiredRole)),
  })).filter((section) => section.items.length > 0);
}

export function getAllNavigationItems(role: UserRole): NavigationItem[] {
  return getNavigationSections(role).flatMap((s) => s.items);
}
