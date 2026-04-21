import { nanoid } from 'nanoid';

import type { ControlCommand } from '../lib/contracts/control.ts';
import type { RealtimeEventEnvelope } from '../lib/contracts/realtime.ts';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'maintainer' | 'viewer';
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  root_path: string;
  status: 'idle' | 'connected' | 'collecting';
  created_at: string;
  updated_at: string;
  last_event_at?: string;
};

export type RunRecord = {
  id: string;
  workspace_id: string;
  status: 'running' | 'completed';
  started_at: string;
  finished_at?: string;
  summary: Record<string, unknown>;
};

export type ChangeRecord = {
  id: string;
  workspace_id: string;
  run_id?: string;
  title: string;
  event_type: string;
  occurred_at: string;
  source_path: string;
  payload: unknown;
};

export type ControlRecord = ControlCommand & {
  created_at: string;
};

export type SessionRecord = {
  id: string;
  created_at: string;
  user: SessionUser;
};

export type InMemoryRepository = {
  workspaces: Map<string, WorkspaceRecord>;
  runs: Map<string, RunRecord>;
  changes: Map<string, ChangeRecord>;
  controls: Map<string, ControlRecord>;
  sessions: Map<string, SessionRecord>;
};

const defaultWorkspaceId = 'workspace-demo';

function nowIsoString(): string {
  return new Date().toISOString();
}

function extractRunId(event: RealtimeEventEnvelope): string {
  if (
    event.payload &&
    typeof event.payload === 'object' &&
    !Array.isArray(event.payload) &&
    'run_id' in event.payload &&
    typeof event.payload.run_id === 'string' &&
    event.payload.run_id.length > 0
  ) {
    return event.payload.run_id;
  }

  return `run_${event.workspace_id}`;
}

export function createRepository(): InMemoryRepository {
  const repository: InMemoryRepository = {
    workspaces: new Map(),
    runs: new Map(),
    changes: new Map(),
    controls: new Map(),
    sessions: new Map(),
  };

  const createdAt = nowIsoString();
  repository.workspaces.set(defaultWorkspaceId, {
    id: defaultWorkspaceId,
    name: 'Demo Workspace',
    root_path: process.cwd(),
    status: 'idle',
    created_at: createdAt,
    updated_at: createdAt,
  });

  return repository;
}

export function listWorkspaces(repository: InMemoryRepository): WorkspaceRecord[] {
  return [...repository.workspaces.values()].sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at),
  );
}

export function getWorkspace(
  repository: InMemoryRepository,
  workspaceId: string,
): WorkspaceRecord | null {
  return repository.workspaces.get(workspaceId) ?? null;
}

export function createWorkspace(
  repository: InMemoryRepository,
  input: {
    name: string;
    rootPath: string;
  },
): WorkspaceRecord {
  const timestamp = nowIsoString();
  const workspace: WorkspaceRecord = {
    id: `ws_${nanoid(10)}`,
    name: input.name,
    root_path: input.rootPath,
    status: 'idle',
    created_at: timestamp,
    updated_at: timestamp,
  };

  repository.workspaces.set(workspace.id, workspace);
  return workspace;
}

export function listRuns(repository: InMemoryRepository): RunRecord[] {
  return [...repository.runs.values()].sort((left, right) =>
    right.started_at.localeCompare(left.started_at),
  );
}

export function getRun(repository: InMemoryRepository, runId: string): RunRecord | null {
  return repository.runs.get(runId) ?? null;
}

export function listChanges(repository: InMemoryRepository): ChangeRecord[] {
  return [...repository.changes.values()].sort((left, right) =>
    right.occurred_at.localeCompare(left.occurred_at),
  );
}

export function getChange(
  repository: InMemoryRepository,
  changeId: string,
): ChangeRecord | null {
  return repository.changes.get(changeId) ?? null;
}

export function recordRealtimeEvent(
  repository: InMemoryRepository,
  event: RealtimeEventEnvelope,
): {
  run: RunRecord;
  change: ChangeRecord;
} {
  const workspace = repository.workspaces.get(event.workspace_id);
  const timestamp = nowIsoString();

  if (workspace) {
    workspace.updated_at = timestamp;
    workspace.last_event_at = event.occurred_at;
    workspace.status = event.event_type.includes('.started')
      ? 'collecting'
      : event.event_type.includes('.completed')
        ? 'connected'
        : workspace.status;
    repository.workspaces.set(workspace.id, workspace);
  }

  const runId = extractRunId(event);
  const existingRun = repository.runs.get(runId);
  const summary =
    event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
      ? (event.payload as Record<string, unknown>)
      : { value: event.payload };

  const run: RunRecord = {
    id: runId,
    workspace_id: event.workspace_id,
    status: event.event_type.includes('.completed') ? 'completed' : 'running',
    started_at: existingRun?.started_at ?? event.occurred_at,
    finished_at: event.event_type.includes('.completed') ? event.occurred_at : existingRun?.finished_at,
    summary: {
      ...(existingRun?.summary ?? {}),
      ...summary,
      last_event_type: event.event_type,
    },
  };
  repository.runs.set(run.id, run);

  const change: ChangeRecord = {
    id: event.event_id,
    workspace_id: event.workspace_id,
    run_id: run.id,
    title: event.event_type,
    event_type: event.event_type,
    occurred_at: event.occurred_at,
    source_path: event.source_path,
    payload: event.payload,
  };
  repository.changes.set(change.id, change);

  return { run, change };
}

export function createSession(
  repository: InMemoryRepository,
  user: SessionUser,
): SessionRecord {
  const session: SessionRecord = {
    id: `sess_${nanoid(16)}`,
    created_at: nowIsoString(),
    user,
  };

  repository.sessions.set(session.id, session);
  return session;
}

export function getSession(
  repository: InMemoryRepository,
  sessionId: string,
): SessionRecord | null {
  return repository.sessions.get(sessionId) ?? null;
}

export function destroySession(
  repository: InMemoryRepository,
  sessionId: string,
): void {
  repository.sessions.delete(sessionId);
}

export function recordControlCommand(
  repository: InMemoryRepository,
  command: ControlCommand,
): ControlRecord {
  const controlRecord: ControlRecord = {
    ...command,
    created_at: nowIsoString(),
  };

  repository.controls.set(command.request_id, controlRecord);
  return controlRecord;
}
