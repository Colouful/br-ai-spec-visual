import type { UserRole } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

export type NavigationIcon =
  | "layout-dashboard"
  | "file-stack"
  | "list-todo"
  | "activity"
  | "users"
  | "settings";

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
        href: "/",
        icon: "layout-dashboard",
        label: "总览",
        requiredRole: "viewer",
        summary: "查看系统概况与关键指标",
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
