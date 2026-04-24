import bcrypt from "bcryptjs";
import { Prisma, UserRole, type Workspace } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "./prisma";
import { parseRegistryFile } from "@/lib/ingest/registry";

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

export async function ensureDemoWorkspaceSeedData() {
  const workspace = await ensureDemoWorkspace();
  if (!workspace) return null;

  await seedRegistrySnapshot(workspace);
  await seedWorkbenchScenario(workspace);
  return workspace;
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

async function seedRegistrySnapshot(workspace: Workspace) {
  const registryCount = await prisma.registryItem.count({
    where: { workspaceId: workspace.id },
  });
  if (registryCount > 0 || !workspace.rootPath) {
    return;
  }

  const files = [
    ".agents/registry/flows.json",
    ".agents/registry/roles.json",
  ] as const;

  for (const file of files) {
    try {
      const absolutePath = path.resolve(workspace.rootPath, file);
      const content = await readFile(absolutePath, "utf8");
      const parsed = parseRegistryFile({
        filePath: file,
        content,
        workspaceId: workspace.id,
      });

      for (const item of parsed.items) {
        await prisma.registryItem.upsert({
          where: {
            workspaceId_category_slug: {
              workspaceId: workspace.id,
              category: item.category,
              slug: item.slug,
            },
          },
          create: {
            workspaceId: workspace.id,
            category: item.category,
            slug: item.slug,
            name: item.name,
            label: item.label ?? undefined,
            status: item.status ?? undefined,
            version: item.version ?? 1,
            sourcePath: item.sourcePath ?? file,
            payload: item.payload as Prisma.InputJsonValue,
          },
          update: {
            name: item.name,
            label: item.label ?? undefined,
            status: item.status ?? undefined,
            version: item.version ?? 1,
            sourcePath: item.sourcePath ?? file,
            payload: item.payload as Prisma.InputJsonValue,
          },
        });
      }
    } catch {
      // 注册表导入仅用于 demo 场景；失败时回退到运行时文件系统读取。
    }
  }
}

async function seedWorkbenchScenario(workspace: Workspace) {
  const runCount = await prisma.runState.count({
    where: { workspaceId: workspace.id },
  });
  if (runCount > 0) {
    return;
  }

  const now = new Date("2026-04-24T10:00:00.000Z");
  const earlier = new Date("2026-04-24T09:00:00.000Z");
  const handoffAt = new Date("2026-04-24T09:20:00.000Z");
  const runKey = "run_demo_current_expert";
  const changeKey = "workspace-current-expert";

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      updatedAt: now,
    },
  });

  await prisma.runState.create({
    data: {
      workspaceId: workspace.id,
      runKey,
      status: "waiting-approval",
      lastEventType: "gate.waiting",
      lastOccurredAt: now,
      turnCount: 3,
      payload: {
        current_role: "frontend-implementer",
        pending_gate: "before-archive",
        trigger: {
          source: "demo-seed",
          entry: "task-orchestrator",
          raw_input: "把工作区默认首页改成当前专家工作台，并补门禁审批能力",
        },
        task: {
          change_id: changeKey,
          summary: "完成工作台首页、门禁审批与治理页改造",
        },
        flow: {
          id: "prd-to-delivery",
          name: "PRD 到交付",
        },
        events: [
          {
            at: earlier.toISOString(),
            type: "run-created",
          },
          {
            at: handoffAt.toISOString(),
            type: "role-handoff",
            from_role: "requirement-analyst",
            to_role: "frontend-implementer",
          },
          {
            at: now.toISOString(),
            type: "gate.waiting",
            gate: "before-archive",
          },
        ],
        gate_context: {
          gate_id: "before-archive",
          blocked_by_role: "frontend-implementer",
          resume_to_role: "code-guardian",
          required_user_action: "请确认规范资产、任务清单与归档前检查项",
          blocked_reason: "等待归档前人工审核",
        },
      },
    },
  });

  await prisma.runEvent.createMany({
    data: [
      {
        workspaceId: workspace.id,
        runKey,
        eventType: "run-created",
        occurredAt: earlier,
        payload: {
          title: "创建当前专家工作台演示 run",
        },
      },
      {
        workspaceId: workspace.id,
        runKey,
        eventType: "role-handoff",
        occurredAt: handoffAt,
        payload: {
          from_role: "requirement-analyst",
          to_role: "frontend-implementer",
        },
      },
      {
        workspaceId: workspace.id,
        runKey,
        eventType: "gate.waiting",
        occurredAt: now,
        payload: {
          gate: "before-archive",
        },
      },
    ],
  });

  await prisma.changeDocument.createMany({
    data: [
      {
        workspaceId: workspace.id,
        changeKey,
        docType: "proposal",
        title: "当前专家工作台改造提案",
        sourcePath: "openspec/changes/workspace-current-expert/proposal.md",
        status: "review",
      },
      {
        workspaceId: workspace.id,
        changeKey,
        docType: "tasks",
        title: "当前专家工作台改造任务",
        sourcePath: "openspec/changes/workspace-current-expert/tasks.md",
        status: "review",
      },
      {
        workspaceId: workspace.id,
        changeKey: "archived-change-sample",
        docType: "archive",
        title: "历史归档样例",
        sourcePath: "openspec/changes/archived-change-sample/archive.md",
        status: "archived",
        archivedAt: new Date("2026-04-23T18:00:00.000Z"),
      },
    ],
  });

  await prisma.specAsset.createMany({
    data: [
      {
        workspaceId: workspace.id,
        runId: runKey,
        changeId: changeKey,
        sourceKind: "openspec",
        sourcePath: "openspec/changes/workspace-current-expert/proposal.md",
        assetType: "proposal",
        status: "active",
        title: "proposal",
      },
      {
        workspaceId: workspace.id,
        runId: runKey,
        changeId: changeKey,
        sourceKind: "openspec",
        sourcePath: "openspec/changes/workspace-current-expert/tasks.md",
        assetType: "tasks",
        status: "reviewing",
        title: "tasks",
      },
      {
        workspaceId: workspace.id,
        runId: runKey,
        sourceKind: "ai-spec-history",
        sourcePath: ".ai-spec/history/run_demo_current_expert/implementation-notes.md",
        assetType: "implementation-notes",
        status: "history",
        title: "implementation-notes",
      },
      {
        workspaceId: workspace.id,
        changeId: "archived-change-sample",
        sourceKind: "openspec",
        sourcePath: "openspec/changes/archived-change-sample/archive.md",
        assetType: "archive",
        status: "archived",
        title: "archive",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.gateApproval.create({
    data: {
      workspaceId: workspace.id,
      runId: runKey,
      nodeId: "node:frontend-implementer",
      roleCode: "frontend-implementer",
      gateType: "before-archive",
      status: "waiting-approval",
      mode: "main-flow-blocking",
      reason: "等待归档前人工审核",
      requiredAssetsJson: [
        "openspec/changes/workspace-current-expert/tasks.md",
      ],
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        workspaceId: workspace.id,
        runId: runKey,
        nodeId: "node:frontend-implementer",
        type: "gate.waiting",
        title: "门禁进入等待审批",
        payload: {
          gate: "before-archive",
        },
      },
    ],
  });
}
