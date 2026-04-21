import { describe, expect, test } from 'vitest';

import {
  createConnectToken,
  validateConnectToken,
} from '@/server/connect-token';

describe('connect token validation', () => {
  test('accepts a matching workspace, agent, and token before expiry', () => {
    const now = new Date('2026-04-20T10:00:00.000Z');
    const issued = createConnectToken({
      workspaceId: 'ws-demo',
      agentId: 'collector-1',
      issuedAt: now,
      ttlSeconds: 60,
      secret: 'test-secret',
    });

    const result = validateConnectToken({
      token: issued.token,
      workspaceId: 'ws-demo',
      agentId: 'collector-1',
      now: new Date('2026-04-20T10:00:30.000Z'),
      secret: 'test-secret',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`expected token validation to succeed, got ${result.reason}`);
    }
    expect(result.claims).toMatchObject({
      workspace_id: 'ws-demo',
      agent_id: 'collector-1',
      expires_at: '2026-04-20T10:01:00.000Z',
    });
  });

  test('rejects a token when workspace mismatch or expired', () => {
    const now = new Date('2026-04-20T10:00:00.000Z');
    const issued = createConnectToken({
      workspaceId: 'ws-demo',
      agentId: 'collector-1',
      issuedAt: now,
      ttlSeconds: 30,
      secret: 'test-secret',
    });

    expect(
      validateConnectToken({
        token: issued.token,
        workspaceId: 'another',
        agentId: 'collector-1',
        now: new Date('2026-04-20T10:00:10.000Z'),
        secret: 'test-secret',
      }),
    ).toMatchObject({
      ok: false,
      reason: 'workspace_mismatch',
    });

    expect(
      validateConnectToken({
        token: issued.token,
        workspaceId: 'ws-demo',
        agentId: 'collector-1',
        now: new Date('2026-04-20T10:00:40.000Z'),
        secret: 'test-secret',
      }),
    ).toMatchObject({
      ok: false,
      reason: 'expired',
    });
  });
});
