import { nanoid } from 'nanoid';

import { createConnectToken } from './connect-token.ts';
import { parseControlCommand } from './control.ts';
import {
  commandFromControlCommand,
  enqueueControlOutbox,
  listPendingOutbox,
} from './control-outbox.ts';
import { HttpError, jsonResponse, parseJsonBody } from './http.ts';
import { recordControlCommand } from './repository.ts';
import { getConnectTokenSecret, getRuntime } from './runtime.ts';
import { publishControlCommand } from './ws-server.ts';
import { clearUserSession, getCurrentUser, loginWithCredentials } from '@/lib/auth/server';
import { ensureDemoWorkspace, ensureSeededUsers } from '@/lib/db/bootstrap';
import { prisma } from '@/lib/db/prisma';
import {
  getRunReadModel,
  getWorkspaceReadModel,
  listChangeReadModels,
  listMemberReadModels,
  listRunReadModels,
  listSpecReadModels,
  listTaskReadModels,
  listWorkspaceReadModels,
} from '@/lib/services/read-model';

function resolvePublicBaseUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    requestUrl.host;
  const protocol =
    request.headers.get('x-forwarded-proto') ??
    requestUrl.protocol.replace(/:$/, '');

  return new URL(`${protocol}://${host}`);
}

async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return user;
}

function slugifyWorkspaceName(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function loginAction(request: Request): Promise<Response> {
  const body = await parseJsonBody<{
    email?: string;
    password?: string;
  }>(request);
  const user = await loginWithCredentials(
    String(body.email ?? ''),
    String(body.password ?? ''),
  );

  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  return jsonResponse({
    user,
  });
}

export async function logoutAction(): Promise<Response> {
  await clearUserSession();

  return jsonResponse({
    ok: true,
  });
}

export async function meAction(): Promise<Response> {
  const user = await requireApiUser();

  return jsonResponse({
    user,
  });
}

export async function listWorkspacesAction(request?: Request): Promise<Response> {
  await requireApiUser();
  await ensureSeededUsers();
  await ensureDemoWorkspace();
  const workspaceId = request ? new URL(request.url).searchParams.get('workspace_id') : null;
  const items = (await listWorkspaceReadModels()).filter((item) =>
    workspaceId ? item.id === workspaceId : true,
  );

  return jsonResponse({
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      zone: item.zone,
      health: item.health,
      owners: item.owners,
      projectCount: item.projectCount,
      throughput: item.throughput,
      successRate: item.successRate,
      activeRuns: item.activeRuns,
      openChanges: item.openChanges,
      lastActivityAt: item.lastActivityAt,
      focus: item.focus,
      tags: item.tags,
    })),
  });
}

export async function createWorkspaceAction(request: Request): Promise<Response> {
  await requireApiUser();
  const runtime = getRuntime();
  const body = await parseJsonBody<{
    name?: string;
    root_path?: string;
  }>(request);

  if (!body.name || !body.root_path) {
    throw new HttpError(400, 'name and root_path are required');
  }

  const slugBase = slugifyWorkspaceName(body.name);
  const workspace = await prisma.workspace.create({
    data: {
      id: `workspace_${nanoid(10)}`,
      slug: slugBase || `workspace-${nanoid(6)}`,
      name: body.name,
      rootPath: body.root_path,
      status: 'active',
    },
  });
  runtime.repository.workspaces.set(workspace.id, {
    id: workspace.id,
    name: workspace.name,
    root_path: workspace.rootPath || "",
    status: "idle",
    created_at: workspace.createdAt.toISOString(),
    updated_at: workspace.updatedAt.toISOString(),
  });

  return jsonResponse(
    {
      workspace,
    },
    { status: 201 },
  );
}

export async function getWorkspaceAction(workspaceId: string): Promise<Response> {
  await requireApiUser();
  const runtime = getRuntime();
  const workspace = await getWorkspaceReadModel(workspaceId);

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }
  runtime.repository.workspaces.set(workspace.id, {
    id: workspace.id,
    name: workspace.name,
    root_path: workspace.rootPath || "",
    status: "connected",
    created_at: workspace.createdAt.toISOString(),
    updated_at: workspace.updatedAt.toISOString(),
  });

  return jsonResponse({
    workspace,
  });
}

export async function createConnectTokenAction(
  request: Request,
  workspaceId: string,
): Promise<Response> {
  const user = await requireApiUser();
  const runtime = getRuntime();
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const body = await parseJsonBody<{
    agent_id?: string;
    ttl_seconds?: number;
    capabilities?: string[];
  }>(request);
  const agentId = body.agent_id ?? `browser_${user.id}`;
  const token = createConnectToken({
    workspaceId,
    agentId,
    ttlSeconds: body.ttl_seconds ?? 300,
    secret: getConnectTokenSecret(),
  });
  runtime.repository.workspaces.set(workspace.id, {
    id: workspace.id,
    name: workspace.name,
    root_path: workspace.rootPath || "",
    status: "connected",
    created_at: workspace.createdAt.toISOString(),
    updated_at: workspace.updatedAt.toISOString(),
  });

  return jsonResponse({
    workspace_id: workspaceId,
    agent_id: agentId,
    connect_token: token.token,
    capabilities: body.capabilities ?? ['subscribe:events'],
    expires_at: token.claims.expires_at,
    websocket_url: new URL('/ws', resolvePublicBaseUrl(request)).toString(),
  });
}

export async function listRunsAction(): Promise<Response> {
  await requireApiUser();
  const items = await listRunReadModels();

  return jsonResponse({
    items,
  });
}

export async function getRunAction(runId: string): Promise<Response> {
  await requireApiUser();
  const run = await getRunReadModel(runId);

  if (!run) {
    throw new HttpError(404, 'Run not found');
  }

  return jsonResponse({
    run,
  });
}

export async function listChangesAction(request?: Request): Promise<Response> {
  await requireApiUser();
  const workspaceId = request ? new URL(request.url).searchParams.get('workspace_id') : null;
  const items = (await listChangeReadModels()).filter((item) =>
    workspaceId ? item.workspaceId === workspaceId : true,
  );

  return jsonResponse({
    items,
  });
}

export async function listMembersAction(): Promise<Response> {
  await requireApiUser();
  const items = await listMemberReadModels();
  return jsonResponse({ items });
}

export async function listSpecsAction(request?: Request): Promise<Response> {
  await requireApiUser();
  const workspaceId = request ? new URL(request.url).searchParams.get('workspace_id') : null;
  const items = (await listSpecReadModels()).filter((item) =>
    workspaceId ? item.workspaceId === workspaceId : true,
  );
  return jsonResponse({ items });
}

export async function listTasksAction(request?: Request): Promise<Response> {
  await requireApiUser();
  const workspaceId = request ? new URL(request.url).searchParams.get('workspace_id') : null;
  const items = (await listTaskReadModels()).filter((item) =>
    workspaceId ? item.workspaceId === workspaceId : true,
  );
  return jsonResponse({ items });
}

export async function getChangeAction(changeId: string): Promise<Response> {
  await requireApiUser();
  const normalizedId = changeId.replace(/:/g, '__');
  const change = (await listChangeReadModels()).find(
    (item) => item.id === changeId || item.id === normalizedId,
  );

  if (!change) {
    throw new HttpError(404, 'Change not found');
  }

  return jsonResponse({
    change,
  });
}

async function createControlAction(
  request: Request,
  commandName: 'approve' | 'resume',
): Promise<Response> {
  const user = await requireApiUser();
  const runtime = getRuntime();
  const body = await parseJsonBody<Record<string, unknown>>(request);
  const command = parseControlCommand({
    ...body,
    command: commandName,
    actor_id: typeof body.actor_id === 'string' ? body.actor_id : user.id,
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: command.workspace_id },
  });
  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  // 对 approve 做 run_id 一致性校验：确保批准目标就是当前 workspace 真正在门禁等待
  // 的那个 run，避免批到陈旧 run（旧现象：auto 侧 inbox-consumer 因 run_id 错配返回
  // "No pending approval gate found"，receipt rejected）。
  // 允许关闭：前端或自动化场景传 `force: true` 跳过。
  if (command.command === 'approve' && body.force !== true) {
    const runState = await prisma.runState.findUnique({
      where: {
        workspaceId_runKey: {
          workspaceId: command.workspace_id,
          runKey: command.run_id,
        },
      },
      select: { status: true, runKey: true },
    });
    if (!runState) {
      throw new HttpError(
        409,
        `Run "${command.run_id}" not found in workspace "${command.workspace_id}". ` +
          `Please reload the run detail page (it may refer to a stale run).`,
      );
    }
    const status = (runState.status || '').toLowerCase();
    const approvable = status === 'waiting-approval' || status === 'paused';
    if (!approvable) {
      throw new HttpError(
        409,
        `Run "${command.run_id}" is not waiting for approval (current status: "${runState.status || 'unknown'}"). ` +
          `Approving a non-waiting run would be rejected by the IDE side. Pass { force: true } to override.`,
      );
    }
  }

  const controlRecord = recordControlCommand(runtime.repository, command);
  const delivery = publishControlCommand(controlRecord);

  // 写入 outbox 等待 auto 侧 cli 边界 pull 后应用
  const outboxCommand = commandFromControlCommand(command);
  const outboxRow = await enqueueControlOutbox({
    workspaceId: command.workspace_id,
    runKey: command.run_id,
    command: outboxCommand,
    payload: {
      gate:
        command.command === 'approve'
          ? typeof body.gate === 'string'
            ? body.gate
            : 'before-implementation'
          : undefined,
      reason:
        command.command === 'approve'
          ? command.comment
          : 'reason' in command
          ? command.reason
          : undefined,
      run_id: command.run_id,
      checkpoint_id:
        command.command === 'resume' ? command.checkpoint_id : undefined,
      requested_by: controlRecord.actor_id,
      decision: command.command === 'approve' ? command.decision : undefined,
    },
    actorId: controlRecord.actor_id,
  });

  return jsonResponse({
    ok: true,
    command: controlRecord,
    delivery,
    outbox: {
      id: outboxRow.id,
      status: outboxRow.status,
      command: outboxRow.command,
      created_at: outboxRow.createdAt.toISOString(),
    },
  });
}

export async function approveAction(request: Request): Promise<Response> {
  return createControlAction(request, 'approve');
}

export async function resumeAction(request: Request): Promise<Response> {
  return createControlAction(request, 'resume');
}

export async function pendingControlsAction(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace_id');
  if (!workspaceId) {
    throw new HttpError(400, 'workspace_id is required');
  }
  const since = url.searchParams.get('since');
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  const items = await listPendingOutbox({
    workspaceId,
    since,
    limit: Number.isFinite(limit ?? NaN) ? (limit as number) : undefined,
  });

  return jsonResponse({ items });
}
