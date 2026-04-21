import { createRealtimeEnvelope } from '../server/realtime.ts';

export function createCollectorEventEnvelope(input: {
  workspaceId: string;
  agentId: string;
  connectToken: string;
  capabilities?: string[];
  eventType: string;
  occurredAt?: string;
  sourcePath: string;
  payload: unknown;
}) {
  return createRealtimeEnvelope({
    workspaceId: input.workspaceId,
    agentId: input.agentId,
    connectToken: input.connectToken,
    capabilities: input.capabilities ?? [],
    sourceType: 'collector',
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    payload: input.payload,
    sourcePath: input.sourcePath,
  });
}
