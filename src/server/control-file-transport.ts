import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";

/**
 * File-Inbox 兜底传输
 *
 * 当 visual 与 auto 共享文件系统（典型场景：本地同机部署或挂载卷的容器）时，
 * 直接把控制信封写入目标项目的 `.ai-spec/inbox/control-<id>.json`，
 * auto 侧 inbox-consumer 在 protocol-step / -advance / -update / -status 命令边界
 * 会自然消费，无需依赖 HTTP-pull。
 *
 * 优先级解析 inbox 目录：
 *   1. `Workspace.rootPath`（按 workspace 维度）→ `<rootPath>/.ai-spec/inbox`
 *   2. 环境变量 `AI_SPEC_INBOX_DIR_DEFAULT`（全局兜底）
 *
 * 设计原则：
 * - HTTP-pull 仍是主路径，文件路径仅做兜底，写入失败保持静默；
 * - 信封格式与 auto 侧 inbox-consumer 期望严格一致；
 * - 写入由 enqueueControlOutbox 在事务外触发，不阻塞 Outbox 主路径。
 */

interface FileTransportInput {
  workspaceId: string;
  outboxId: string;
  command: string;
  payload: Record<string, unknown>;
  signature: string;
  expiresAt: Date | null;
}

const ENV_DEFAULT_DIR = "AI_SPEC_INBOX_DIR_DEFAULT";

async function resolveInboxDir(workspaceId: string): Promise<string | null> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { rootPath: true },
    });
    if (workspace?.rootPath && workspace.rootPath.trim().length > 0) {
      return path.join(path.resolve(workspace.rootPath.trim()), ".ai-spec", "inbox");
    }
  } catch {
    // 读取失败回退到环境变量
  }

  const envDir = process.env[ENV_DEFAULT_DIR];
  if (envDir && envDir.trim().length > 0) {
    return path.resolve(envDir.trim());
  }
  return null;
}

export async function writeOutboxToFileInbox(input: FileTransportInput) {
  const inboxDir = await resolveInboxDir(input.workspaceId);
  if (!inboxDir) {
    return { written: false as const, reason: "no inbox_dir resolved" };
  }

  try {
    mkdirSync(inboxDir, { recursive: true });
  } catch {
    return { written: false as const, reason: "mkdir failed" };
  }

  const envelope = {
    outbox_id: input.outboxId,
    workspace_id: input.workspaceId,
    command: input.command,
    payload: input.payload,
    signature: input.signature,
    expires_at: input.expiresAt?.toISOString() ?? null,
    written_at: new Date().toISOString(),
    transport: "file-inbox",
  };

  const safeId = input.outboxId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `control-${Date.now()}-${safeId}.json`;
  const target = path.join(inboxDir, filename);

  try {
    writeFileSync(target, JSON.stringify(envelope, null, 2), "utf-8");
    return { written: true as const, path: target };
  } catch (err) {
    return {
      written: false as const,
      reason: err instanceof Error ? err.message : "write failed",
    };
  }
}
