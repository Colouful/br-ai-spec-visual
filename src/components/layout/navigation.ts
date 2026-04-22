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
  | "bar-chart"
  | "workflow";

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

const PLATFORM_SECTIONS: NavigationSection[] = [
  {
    id: "platform-home",
    label: "工作台",
    items: [
      {
        href: "/workspaces",
        icon: "folders",
        label: "工作区",
        requiredRole: "viewer",
        summary: "选择项目并查看跨工作区健康",
      },
    ],
  },
  {
    id: "platform-governance",
    label: "平台治理",
    items: [
      {
        href: "/platform/installations",
        icon: "bar-chart",
        label: "用户安装使用",
        requiredRole: "admin",
        summary: "CLI 安装用户、命令使用与趋势",
      },
      {
        href: "/platform/members",
        icon: "users",
        label: "全局成员",
        requiredRole: "admin",
        summary: "维护账号、角色与权限策略",
      },
      {
        href: "/platform/settings",
        icon: "settings",
        label: "系统设置",
        requiredRole: "admin",
        summary: "默认权限、连接策略与全局配置",
      },
    ],
  },
];

interface WorkspaceItemTemplate {
  segment: string;
  icon: NavigationIcon;
  label: string;
  requiredRole: UserRole;
  summary: string;
}

const WORKSPACE_TEMPLATE: NavigationSection[] = [
  {
    id: "workspace-flow",
    label: "项目主线",
    items: (
      [
        {
          segment: "pipeline",
          icon: "workflow",
          label: "流水线",
          requiredRole: "viewer",
          summary: "规范 → 计划 → 运行 → 评审 → 归档 五阶段主视图",
        },
      ] satisfies WorkspaceItemTemplate[]
    ).map((tpl) => buildPlaceholderItem(tpl)),
  },
  {
    id: "workspace-artifacts",
    label: "产物",
    items: (
      [
        {
          segment: "specs",
          icon: "file-stack",
          label: "规范",
          requiredRole: "viewer",
          summary: "提案、设计与规范文档列表",
        },
        {
          segment: "runs",
          icon: "activity",
          label: "运行",
          requiredRole: "maintainer",
          summary: "本工作区的执行历史",
        },
        {
          segment: "changes",
          icon: "git-branch",
          label: "变更",
          requiredRole: "maintainer",
          summary: "变更看板与状态流转",
        },
        {
          segment: "topology",
          icon: "network",
          label: "拓扑",
          requiredRole: "viewer",
          summary: "角色 / 资产 / 关系图谱",
        },
      ] satisfies WorkspaceItemTemplate[]
    ).map((tpl) => buildPlaceholderItem(tpl)),
  },
  {
    id: "workspace-governance",
    label: "工作区治理",
    items: (
      [
        {
          segment: "members",
          icon: "users",
          label: "成员",
          requiredRole: "viewer",
          summary: "工作区内成员与角色",
        },
        {
          segment: "settings",
          icon: "settings",
          label: "设置",
          requiredRole: "admin",
          summary: "工作区级配置",
        },
      ] satisfies WorkspaceItemTemplate[]
    ).map((tpl) => buildPlaceholderItem(tpl)),
  },
];

function buildPlaceholderItem(tpl: WorkspaceItemTemplate): NavigationItem {
  return {
    href: `__WORKSPACE__/${tpl.segment}`,
    icon: tpl.icon,
    label: tpl.label,
    requiredRole: tpl.requiredRole,
    summary: tpl.summary,
  };
}

function materializeWorkspaceSections(slug: string): NavigationSection[] {
  return WORKSPACE_TEMPLATE.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: item.href.replace("__WORKSPACE__", `/w/${encodeURIComponent(slug)}`),
    })),
  }));
}

function filterByRole(
  sections: NavigationSection[],
  role: UserRole,
): NavigationSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(role, item.requiredRole)),
    }))
    .filter((section) => section.items.length > 0);
}

export function getPlatformNavigationSections(role: UserRole) {
  return filterByRole(PLATFORM_SECTIONS, role);
}

export function getWorkspaceNavigationSections(role: UserRole, slug: string) {
  return filterByRole(materializeWorkspaceSections(slug), role);
}

export function getAllPlatformItems(role: UserRole): NavigationItem[] {
  return getPlatformNavigationSections(role).flatMap((section) => section.items);
}

export function getAllWorkspaceItems(
  role: UserRole,
  slug: string,
): NavigationItem[] {
  return getWorkspaceNavigationSections(role, slug).flatMap(
    (section) => section.items,
  );
}
