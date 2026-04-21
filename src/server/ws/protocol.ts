import { createCollectorEventEnvelope } from "../../collector/events.ts";
import { realtimeEventEnvelopeSchema } from "../../lib/contracts/realtime.ts";

export function buildCollectorHandshake(input: {
  workspaceId: string;
  agentId: string;
  connectToken: string;
  capabilities: string[];
}) {
  return createCollectorEventEnvelope({
    workspaceId: input.workspaceId,
    agentId: input.agentId,
    connectToken: input.connectToken,
    capabilities: input.capabilities,
    eventType: "session.hello",
    sourcePath: "collector://handshake",
    payload: {
      kind: "collector-handshake",
    },
  });
}

export function validateCollectorEvent(payload: unknown) {
  return realtimeEventEnvelopeSchema.safeParse(payload);
}
