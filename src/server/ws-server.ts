import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Duplex } from 'node:stream';

import { nanoid } from 'nanoid';
import WebSocket, { WebSocketServer } from 'ws';

import type { ControlCommand } from '../lib/contracts/control.ts';
import type { RealtimeEventEnvelope } from '../lib/contracts/realtime.ts';
import { validateConnectToken } from './connect-token.ts';
import {
  createRealtimeEnvelope,
  isHandshakeEvent,
  parseRealtimeEnvelope,
} from './realtime.ts';
import {
  recordRealtimeEvent,
  type WorkspaceRecord,
} from './repository.ts';
import {
  registerConnection,
  removeConnection,
  routeRealtimeEvent,
} from './realtime-hub.ts';
import { getConnectTokenSecret, getRuntime } from './runtime.ts';
import { recordInstallationActivity } from './installations-presence.ts';

type DeliveryTarget = 'browser' | 'collector' | 'all';

type PublishResult = {
  delivered_connection_ids: string[];
  attempted_connection_ids: string[];
};

type IngestProjectionRefreshPayload = {
  source_path: string;
  source_kind: string;
  inserted_raw_count: number;
  projected_raw_count: number;
  skipped_raw_count: number;
};

type HandshakeSession = {
  connectionId: string;
  workspaceId: string;
  agentId: string;
  sourceType: RealtimeEventEnvelope['source_type'];
};

function getWorkspaceById(workspaceId: string): WorkspaceRecord | null {
  return getRuntime().repository.workspaces.get(workspaceId) ?? null;
}

function getWorkspaceRecipients(
  workspaceId: string,
  target: DeliveryTarget,
): string[] {
  const runtime = getRuntime();
  const workspace = runtime.hub.workspaces.get(workspaceId);
  if (!workspace) {
    return [];
  }

  if (target === 'browser') {
    return [...workspace.browserIds];
  }

  if (target === 'collector') {
    return [...workspace.collectorIds];
  }

  return [...workspace.browserIds, ...workspace.collectorIds];
}

function sendEnvelope(connectionId: string, envelope: RealtimeEventEnvelope): boolean {
  const runtime = getRuntime();
  const socket = runtime.sockets.get(connectionId);
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    runtime.sockets.delete(connectionId);
    removeConnection(runtime.hub, connectionId);
    return false;
  }

  socket.send(JSON.stringify(envelope));
  return true;
}

function publishEnvelope(
  envelope: RealtimeEventEnvelope,
  recipients: string[],
): PublishResult {
  const delivered: string[] = [];

  for (const connectionId of recipients) {
    if (sendEnvelope(connectionId, envelope)) {
      delivered.push(connectionId);
    }
  }

  return {
    delivered_connection_ids: delivered,
    attempted_connection_ids: recipients,
  };
}

function createServerEvent(input: {
  workspaceId: string;
  agentId?: string;
  eventType: string;
  payload: unknown;
  sourcePath: string;
}): RealtimeEventEnvelope {
  return createRealtimeEnvelope({
    workspaceId: input.workspaceId,
    agentId: input.agentId ?? 'server',
    connectToken: 'server',
    capabilities: ['bridge:server'],
    sourceType: 'server',
    eventType: input.eventType,
    payload: input.payload,
    sourcePath: input.sourcePath,
  });
}

function closeWithError(
  socket: WebSocket,
  workspaceId: string,
  message: string,
  details?: unknown,
): void {
  const errorEvent = createServerEvent({
    workspaceId,
    eventType: 'session.error',
    payload: {
      message,
      details,
    },
    sourcePath: '/ws',
  });
  socket.send(JSON.stringify(errorEvent));
  socket.close(4001, message);
}

function finalizeHandshake(socket: WebSocket, envelope: RealtimeEventEnvelope): HandshakeSession | null {
  const workspace = getWorkspaceById(envelope.workspace_id);
  if (!workspace) {
    closeWithError(socket, envelope.workspace_id, 'Unknown workspace');
    return null;
  }

  const tokenValidation = validateConnectToken({
    token: envelope.connect_token,
    workspaceId: envelope.workspace_id,
    agentId: envelope.agent_id,
    secret: getConnectTokenSecret(),
  });

  if (!tokenValidation.ok) {
    closeWithError(socket, envelope.workspace_id, 'Invalid connect token', tokenValidation);
    return null;
  }

  const runtime = getRuntime();
  const connectionId = `conn_${nanoid(12)}`;
  runtime.sockets.set(connectionId, socket);
  registerConnection(runtime.hub, {
    connectionId,
    workspaceId: envelope.workspace_id,
    sourceType: envelope.source_type,
    capabilities: envelope.capabilities,
    agentId: envelope.agent_id,
  });

  const ackEvent = createServerEvent({
    workspaceId: envelope.workspace_id,
    eventType: 'session.ack',
    payload: {
      connection_id: connectionId,
      source_type: envelope.source_type,
      workspace_id: envelope.workspace_id,
    },
    sourcePath: '/ws',
  });
  socket.send(JSON.stringify(ackEvent));

  workspace.status = 'connected';
  workspace.updated_at = new Date().toISOString();
  runtime.repository.workspaces.set(workspace.id, workspace);

  return {
    connectionId,
    workspaceId: envelope.workspace_id,
    agentId: envelope.agent_id,
    sourceType: envelope.source_type,
  };
}

function validateEventAgainstSession(
  session: HandshakeSession,
  event: RealtimeEventEnvelope,
): boolean {
  return (
    event.workspace_id === session.workspaceId &&
    event.agent_id === session.agentId &&
    event.source_type === session.sourceType
  );
}

function ingestRealtimeEvent(event: RealtimeEventEnvelope): PublishResult {
  const runtime = getRuntime();
  const { change, run } = recordRealtimeEvent(runtime.repository, event);
  const routed = routeRealtimeEvent(runtime.hub, event);

  const forwardedEvent = createServerEvent({
    workspaceId: event.workspace_id,
    agentId: event.agent_id,
    eventType: event.event_type,
    payload: {
      change_id: change.id,
      run_id: run.id,
      envelope: event,
    },
    sourcePath: event.source_path,
  });

  return publishEnvelope(forwardedEvent, routed.recipientIds);
}

export function publishEventToWorkspace(
  workspaceId: string,
  target: DeliveryTarget,
  event: RealtimeEventEnvelope,
): PublishResult {
  return publishEnvelope(event, getWorkspaceRecipients(workspaceId, target));
}

export function publishControlCommand(command: ControlCommand): PublishResult {
  const event = createServerEvent({
    workspaceId: command.workspace_id,
    agentId: command.actor_id,
    eventType: `control.${command.command}`,
    payload: command,
    sourcePath: `/api/control/${command.command}`,
  });

  return publishEventToWorkspace(command.workspace_id, 'collector', event);
}

export function publishIngestProjectionEvent(
  workspaceId: string,
  payload: IngestProjectionRefreshPayload,
): PublishResult {
  const event = createServerEvent({
    workspaceId,
    eventType: 'ingest.projected',
    payload,
    sourcePath: payload.source_path,
  });

  return publishEventToWorkspace(workspaceId, 'browser', event);
}

export interface AttachWebSocketServerOptions {
  fallbackUpgrade?: (request: IncomingMessage, socket: Duplex, head: Buffer) => void;
}

export function attachWebSocketServer(
  server: HttpServer,
  options: AttachWebSocketServerOptions = {},
): WebSocketServer {
  const runtime = getRuntime();
  if (runtime.wsServer) {
    return runtime.wsServer;
  }

  const webSocketServer = new WebSocketServer({ noServer: true });
  runtime.wsServer = webSocketServer;

  const installationWsServer = new WebSocketServer({ noServer: true });
  attachInstallationWsHandlers(installationWsServer);

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (url.pathname === '/ws/installation') {
      installationWsServer.handleUpgrade(request, socket, head, (webSocket) => {
        installationWsServer.emit('connection', webSocket, request);
      });
      return;
    }

    if (url.pathname !== '/ws') {
      // 交还给 Next.js 处理（HMR / RSC 等），切勿 destroy，否则客户端无法水合
      if (options.fallbackUpgrade) {
        options.fallbackUpgrade(request, socket, head);
      }
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit('connection', webSocket, request);
    });
  });

  webSocketServer.on('connection', (socket) => {
    let session: HandshakeSession | null = null;

    socket.on('message', (rawData) => {
      let envelope: RealtimeEventEnvelope;

      try {
        envelope = parseRealtimeEnvelope(JSON.parse(rawData.toString()));
      } catch (error) {
        closeWithError(socket, session?.workspaceId ?? 'unknown', 'Malformed realtime envelope', error);
        return;
      }

      if (!session) {
        if (!isHandshakeEvent(envelope)) {
          closeWithError(socket, envelope.workspace_id, 'Handshake required before publishing');
          return;
        }

        session = finalizeHandshake(socket, envelope);
        return;
      }

      if (!validateEventAgainstSession(session, envelope)) {
        closeWithError(socket, session.workspaceId, 'Event does not match authenticated session');
        return;
      }

      if (envelope.source_type === 'server') {
        closeWithError(socket, session.workspaceId, 'Client cannot publish server events');
        return;
      }

      ingestRealtimeEvent(envelope);
    });

    socket.on('close', () => {
      if (session) {
        const runtimeState = getRuntime();
        runtimeState.sockets.delete(session.connectionId);
        removeConnection(runtimeState.hub, session.connectionId);
      }
    });
  });

  return webSocketServer;
}

/**
 * /ws/installation — lightweight heartbeat channel for CLI telemetry presence.
 * Separate from the main /ws channel; uses its own minimal message schema:
 *   client → server: { type: 'hello' | 'heartbeat', installationId, hostname?, username?, command?, status? }
 *   server → client: { type: 'ack' | 'ping' | 'pong' }
 */
function attachInstallationWsHandlers(server: WebSocketServer): void {
  server.on('connection', (socket) => {
    let installationId: string | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = (): void => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    heartbeatTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
        } catch {
          // ignore
        }
      }
    }, 30_000);

    socket.on('message', (raw) => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const id = typeof payload.installationId === 'string' ? payload.installationId : null;
      if (!id) {
        return;
      }
      installationId = id;

      recordInstallationActivity({
        installationId: id,
        hostname: typeof payload.hostname === 'string' ? payload.hostname : null,
        username: typeof payload.username === 'string' ? payload.username : null,
        command: typeof payload.command === 'string' ? payload.command : null,
        status: typeof payload.status === 'string' ? payload.status : null,
      });

      const type = typeof payload.type === 'string' ? payload.type : 'heartbeat';
      if (type === 'hello') {
        try {
          socket.send(JSON.stringify({ type: 'ack', ts: Date.now() }));
        } catch {
          // ignore
        }
      }
    });

    socket.on('close', () => {
      cleanup();
      installationId = null;
    });

    socket.on('error', () => {
      cleanup();
    });
  });
}
