import bcrypt from "bcryptjs";
import { UserRole, type Workspace } from "@prisma/client";

import { prisma } from "./prisma";

export async function ensureSeededUsers() {
  const count = await prisma.user.count();
  if (count > 0) {
    return;
  }

  const users = [
    {
      email: "admin@local",
      name: "控制台管理员",
      role: UserRole.admin,
      password: "Console#2026",
    },
    {
      email: "maintainer@local",
      name: "执行维护者",
      role: UserRole.maintainer,
      password: "Console#2026",
    },
    {
      email: "viewer@local",
      name: "只读观察者",
      role: UserRole.viewer,
      password: "Console#2026",
    },
  ] as const;

  await prisma.user.createMany({
    data: await Promise.all(
      users.map(async (item) => ({
        email: item.email,
        name: item.name,
        role: item.role,
        passwordHash: await bcrypt.hash(item.password, 10),
      })),
    ),
  });
}

export async function ensureDemoWorkspace(): Promise<Workspace> {
  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@local" },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "br-ai-spec-demo" },
    update: {
      description: "默认连接到当前规范驱动主仓库的数据演示工作区",
      rootPath: "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec",
    },
    create: {
      slug: "br-ai-spec-demo",
      name: "br-ai-spec 主项目",
      description: "默认连接到当前规范驱动主仓库的数据演示工作区",
      rootPath: "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec",
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: adminUser.id,
      },
    },
    update: {
      role: UserRole.admin,
    },
    create: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      role: UserRole.admin,
    },
  });

  return workspace;
}
