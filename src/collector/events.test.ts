import { describe, expect, test } from 'vitest';

import { createCollectorEventEnvelope } from '@/collector/events';

describe('collector event envelope', () => {
  test('creates a stable realtime event with required bridge fields', () => {
    const envelope = createCollectorEventEnvelope({
      workspaceId: 'ws-demo',
      agentId: 'collector-1',
      connectToken: 'token-123',
      capabilities: ['baseline:scan'],
      eventType: 'baseline.scan.completed',
      occurredAt: '2026-04-20T10:00:00.000Z',
      sourcePath: '/repo/demo',
      payload: {
        registryEntries: 2,
        openspecPresent: true,
      },
    });

    expect(envelope).toMatchObject({
      workspace_id: 'ws-demo',
      agent_id: 'collector-1',
      connect_token: 'token-123',
      capabilities: ['baseline:scan'],
      source_type: 'collector',
      event_type: 'baseline.scan.completed',
      occurred_at: '2026-04-20T10:00:00.000Z',
      source_path: '/repo/demo',
    });
    expect(envelope.event_id).toMatch(/^evt_/);
    expect(envelope.content_hash).toMatch(/^sha256:/);
  });
});
