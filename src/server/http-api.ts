import { nanoid } from 'nanoid';

import { createConnectToken } from './connect-token.ts';
import { parseControlCommand } from './control.ts';
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
  const change = (await listChangeReadModels()).find((item) => item.id === changeId);

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

  const controlRecord = recordControlCommand(runtime.repository, command);
  const delivery = publishControlCommand(controlRecord);

  return jsonResponse({
    ok: true,
    command: controlRecord,
    delivery,
  });
}

export async function approveAction(request: Request): Promise<Response> {
  return createControlAction(request, 'approve');
}

export async function resumeAction(request: Request): Promise<Response> {
  return createControlAction(request, 'resume');
}
