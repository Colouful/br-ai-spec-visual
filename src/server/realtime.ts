import { createHash } from 'node:crypto';

import { nanoid } from 'nanoid';

import {
  realtimeEventEnvelopeSchema,
  type RealtimeEventEnvelope,
  type RealtimeSourceType,
} from '../lib/contracts/realtime.ts';

type CreateRealtimeEnvelopeInput = {
  workspaceId: string;
  agentId: string;
  connectToken: string;
  capabilities?: string[];
  sourceType: RealtimeSourceType;
  eventType: string;
  occurredAt?: string;
  payload: unknown;
  sourcePath: string;
  eventId?: string;
  contentHash?: string;
};

export function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return `{${entries
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
    .join(',')}}`;
}

export function createContentHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableSerialize(value)).digest('hex')}`;
}

export function parseRealtimeEnvelope(input: unknown): RealtimeEventEnvelope {
  return realtimeEventEnvelopeSchema.parse(input);
}

export function createRealtimeEnvelope(
  input: CreateRealtimeEnvelopeInput,
): RealtimeEventEnvelope {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const eventId = input.eventId ?? `evt_${nanoid(12)}`;

  return parseRealtimeEnvelope({
    workspace_id: input.workspaceId,
    agent_id: input.agentId,
    connect_token: input.connectToken,
    capabilities: input.capabilities ?? [],
    event_id: eventId,
    source_type: input.sourceType,
    event_type: input.eventType,
    occurred_at: occurredAt,
    payload: input.payload,
    source_path: input.sourcePath,
    content_hash:
      input.contentHash ??
      createContentHash({
        workspace_id: input.workspaceId,
        agent_id: input.agentId,
        source_type: input.sourceType,
        event_type: input.eventType,
        occurred_at: occurredAt,
        payload: input.payload,
        source_path: input.sourcePath,
      }),
  });
}

export function isHandshakeEvent(event: RealtimeEventEnvelope): boolean {
  return event.event_type === 'session.hello';
}
