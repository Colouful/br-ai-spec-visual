import { describe, expect, test } from 'vitest';

import { parseControlCommand } from '@/server/control';

describe('control command payload validation', () => {
  test('parses approve payload with required identifiers', () => {
    const parsed = parseControlCommand({
      command: 'approve',
      request_id: 'req-1',
      workspace_id: 'ws-demo',
      run_id: 'run-1',
      actor_id: 'user-1',
      decision: 'approved',
      comment: 'ship it',
    });

    expect(parsed).toMatchObject({
      command: 'approve',
      request_id: 'req-1',
      workspace_id: 'ws-demo',
      run_id: 'run-1',
      actor_id: 'user-1',
      decision: 'approved',
    });
  });

  test('rejects resume payload without command specific fields', () => {
    expect(() =>
      parseControlCommand({
        command: 'resume',
        request_id: 'req-1',
        workspace_id: 'ws-demo',
        actor_id: 'user-1',
      }),
    ).toThrow(/resume/i);
  });
});
