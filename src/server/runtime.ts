import type { WebSocketServer, WebSocket } from 'ws';

import { createRealtimeHubState, type RealtimeHubState } from './realtime-hub.ts';
import { createRepository, type InMemoryRepository } from './repository.ts';

type ServerRuntime = {
  repository: InMemoryRepository;
  hub: RealtimeHubState;
  sockets: Map<string, WebSocket>;
  wsServer: WebSocketServer | null;
};

const runtimeKey = Symbol.for('br-ai-spec-visual.runtime');

function createRuntime(): ServerRuntime {
  return {
    repository: createRepository(),
    hub: createRealtimeHubState(),
    sockets: new Map(),
    wsServer: null,
  };
}

export function getRuntime(): ServerRuntime {
  const globalScope = globalThis as typeof globalThis & {
    [runtimeKey]?: ServerRuntime;
  };

  if (!globalScope[runtimeKey]) {
    globalScope[runtimeKey] = createRuntime();
  }

  return globalScope[runtimeKey];
}

export function getConnectTokenSecret(): string {
  return process.env.REALTIME_CONNECT_SECRET ?? 'br-ai-spec-visual-dev-secret';
}
