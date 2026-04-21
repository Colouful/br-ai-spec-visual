import { describe, expect, test } from 'vitest';

import {
  createRealtimeHubState,
  registerConnection,
  removeConnection,
  routeRealtimeEvent,
} from '@/server/realtime-hub';

describe('realtime hub connection management', () => {
  test('keeps browser and collector connections separated by workspace', () => {
    const state = createRealtimeHubState();

    registerConnection(state, {
      connectionId: 'browser-1',
      workspaceId: 'ws-demo',
      sourceType: 'browser',
      capabilities: ['subscribe:events'],
    });

    registerConnection(state, {
      connectionId: 'collector-1',
      workspaceId: 'ws-demo',
      sourceType: 'collector',
      capabilities: ['publish:events'],
      agentId: 'agent-c',
    });

    expect(state.workspaces.get('ws-demo')).toMatchObject({
      browserIds: ['browser-1'],
      collectorIds: ['collector-1'],
    });
  });

  test('routes collector event to browsers in the same workspace and removes stale peers', () => {
    const state = createRealtimeHubState();

    registerConnection(state, {
      connectionId: 'browser-1',
      workspaceId: 'ws-demo',
      sourceType: 'browser',
      capabilities: ['subscribe:events'],
    });
    registerConnection(state, {
      connectionId: 'browser-2',
      workspaceId: 'ws-other',
      sourceType: 'browser',
      capabilities: ['subscribe:events'],
    });
    registerConnection(state, {
      connectionId: 'collector-1',
      workspaceId: 'ws-demo',
      sourceType: 'collector',
      capabilities: ['publish:events'],
      agentId: 'agent-c',
    });

    const routed = routeRealtimeEvent(state, {
      event_id: 'evt-1',
      workspace_id: 'ws-demo',
      agent_id: 'agent-c',
      source_type: 'collector',
      event_type: 'baseline.scan.completed',
      occurred_at: '2026-04-20T10:00:00.000Z',
      capabilities: ['publish:events'],
      connect_token: 'ignored-in-pure-logic',
      payload: { files: 3 },
      source_path: '/tmp/project',
      content_hash: 'sha256:abc',
    });

    expect(routed.recipientIds).toEqual(['browser-1']);
    expect(routed.event.workspace_id).toBe('ws-demo');

    removeConnection(state, 'browser-1');
    expect(state.workspaces.get('ws-demo')).toMatchObject({
      browserIds: [],
      collectorIds: ['collector-1'],
    });
  });
});
