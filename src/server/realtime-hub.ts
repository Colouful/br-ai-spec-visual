import type {
  RealtimeEventEnvelope,
  RealtimeSourceType,
} from '../lib/contracts/realtime.ts';

type ConnectionRegistration = {
  connectionId: string;
  workspaceId: string;
  sourceType: RealtimeSourceType;
  capabilities: string[];
  agentId?: string;
};

type HubConnection = ConnectionRegistration;

type WorkspaceConnectionIndex = {
  browserIds: string[];
  collectorIds: string[];
  serverIds: string[];
};

export type RealtimeHubState = {
  connections: Map<string, HubConnection>;
  workspaces: Map<string, WorkspaceConnectionIndex>;
};

function createWorkspaceConnectionIndex(): WorkspaceConnectionIndex {
  return {
    browserIds: [],
    collectorIds: [],
    serverIds: [],
  };
}

function addUnique(ids: string[], connectionId: string): void {
  if (!ids.includes(connectionId)) {
    ids.push(connectionId);
  }
}

function removeId(ids: string[], connectionId: string): string[] {
  return ids.filter((value) => value !== connectionId);
}

function bucketKeyForSource(sourceType: RealtimeSourceType): keyof WorkspaceConnectionIndex {
  if (sourceType === 'browser') {
    return 'browserIds';
  }

  if (sourceType === 'collector') {
    return 'collectorIds';
  }

  return 'serverIds';
}

export function createRealtimeHubState(): RealtimeHubState {
  return {
    connections: new Map(),
    workspaces: new Map(),
  };
}

export function registerConnection(
  state: RealtimeHubState,
  registration: ConnectionRegistration,
): void {
  state.connections.set(registration.connectionId, registration);

  const workspace = state.workspaces.get(registration.workspaceId) ?? createWorkspaceConnectionIndex();
  addUnique(workspace[bucketKeyForSource(registration.sourceType)], registration.connectionId);
  state.workspaces.set(registration.workspaceId, workspace);
}

export function removeConnection(state: RealtimeHubState, connectionId: string): void {
  const existing = state.connections.get(connectionId);
  if (!existing) {
    return;
  }

  state.connections.delete(connectionId);
  const workspace = state.workspaces.get(existing.workspaceId);
  if (!workspace) {
    return;
  }

  workspace.browserIds = removeId(workspace.browserIds, connectionId);
  workspace.collectorIds = removeId(workspace.collectorIds, connectionId);
  workspace.serverIds = removeId(workspace.serverIds, connectionId);
  state.workspaces.set(existing.workspaceId, workspace);
}

export function routeRealtimeEvent(
  state: RealtimeHubState,
  event: RealtimeEventEnvelope,
): {
  event: RealtimeEventEnvelope;
  recipientIds: string[];
} {
  const workspace = state.workspaces.get(event.workspace_id);
  if (!workspace) {
    return {
      event,
      recipientIds: [],
    };
  }

  if (event.source_type === 'collector') {
    return {
      event,
      recipientIds: [...workspace.browserIds],
    };
  }

  if (event.source_type === 'browser') {
    return {
      event,
      recipientIds: [...workspace.collectorIds],
    };
  }

  return {
    event,
    recipientIds: [...workspace.browserIds, ...workspace.collectorIds],
  };
}
