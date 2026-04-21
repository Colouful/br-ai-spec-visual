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

// 进程内缓存：demo workspace 一旦确认存在就不再触发任何 DB 写入，避免并发 SSR
// 触发 MariaDB "Record has changed since last read" 乐观锁竞争。
let demoWorkspaceCache: Workspace | null | undefined;

export async function ensureDemoWorkspace(): Promise<Workspace | null> {
  if (process.env.BR_AI_SPEC_VISUAL_DISABLE_DEMO_WORKSPACE === "1") {
    return null;
  }

  if (demoWorkspaceCache !== undefined) {
    return demoWorkspaceCache;
  }

  const existing = await prisma.workspace.findUnique({
    where: { slug: "br-ai-spec-demo" },
  });
  if (existing) {
    demoWorkspaceCache = existing;
    return existing;
  }

  try {
    const adminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@local" },
    });

    const workspace = await prisma.workspace.create({
      data: {
        slug: "br-ai-spec-demo",
        name: "br-ai-spec 主项目",
        description: "默认连接到当前规范驱动主仓库的数据演示工作区",
        rootPath: "/Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec",
      },
    });

    await prisma.workspaceMember
      .create({
        data: {
          workspaceId: workspace.id,
          userId: adminUser.id,
          role: UserRole.admin,
        },
      })
      .catch((err) => {
        // 并发场景下另一个请求已建好成员；忽略唯一键冲突。
        if (!isKnownConcurrencyError(err)) throw err;
      });

    demoWorkspaceCache = workspace;
    return workspace;
  } catch (err) {
    if (isKnownConcurrencyError(err)) {
      // 并发竞争失败时退回再读一次。
      const retry = await prisma.workspace.findUnique({
        where: { slug: "br-ai-spec-demo" },
      });
      demoWorkspaceCache = retry;
      return retry;
    }
    throw err;
  }
}

function isKnownConcurrencyError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = String((err as { message?: unknown }).message ?? "");
  return (
    message.includes("Record has changed since last read") ||
    message.includes("Unique constraint failed") ||
    message.includes("ER_DUP_ENTRY")
  );
}
