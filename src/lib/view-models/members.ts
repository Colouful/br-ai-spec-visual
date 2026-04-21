import { listMemberReadModels } from "@/lib/services/read-model";
import { formatRelativeTime } from "@/lib/view-models/formatters";
import type { PageHeroVm } from "@/lib/view-models/types";

export interface MemberRowVm {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  workspaceCount: number;
  sessionCount: number;
  lastActivity: string;
  workspaces: Array<{
    id: string;
    name: string;
  }>;
}

export interface MembersPageVm {
  hero: PageHeroVm;
  rows: MemberRowVm[];
}

function mapRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return "管理员";
    case "maintainer":
      return "维护者";
    default:
      return "观察者";
  }
}

export async function getMembersPageVm(timeZone = "Asia/Shanghai"): Promise<MembersPageVm> {
  const members = await listMemberReadModels();
  const now = new Date();
  const rows = members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    roleLabel: mapRoleLabel(member.role),
    workspaceCount: member.workspaceCount,
    sessionCount: member.sessionCount,
    lastActivity: formatRelativeTime(member.lastActivityAt, { now, timeZone }),
    workspaces: member.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
    })),
  }));

  return {
    hero: {
      eyebrow: "成员管理",
      title: "按成员视角管理工作区与访问角色",
      subtitle: "这里直接展示成员、所属工作区、会话情况与最近活动，方便做权限和协作治理。",
      stats: [
        { label: "成员数", value: String(rows.length) },
        { label: "管理员", value: String(rows.filter((row) => row.roleLabel === "管理员").length) },
        { label: "活跃会话", value: String(rows.reduce((sum, row) => sum + row.sessionCount, 0)) },
      ],
    },
    rows,
  };
}
