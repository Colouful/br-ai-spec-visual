import { describe, expect, it } from "vitest";

import { buildCollectorHandshake, validateCollectorEvent } from "./protocol";

describe("ws protocol", () => {
  it("builds collector handshake payload", () => {
    const handshake = buildCollectorHandshake({
      workspaceId: "ws_1",
      agentId: "agent_1",
      connectToken: "token_1",
      capabilities: ["baseline-scan", "control"],
    });

    expect(handshake).toMatchObject({
      workspace_id: "ws_1",
      agent_id: "agent_1",
      connect_token: "token_1",
      capabilities: ["baseline-scan", "control"],
      source_type: "collector",
      event_type: "session.hello",
      source_path: "collector://handshake",
      payload: {
        kind: "collector-handshake",
      },
    });
    expect(handshake.event_id).toMatch(/^evt_/);
    expect(handshake.content_hash).toMatch(/^sha256:/);
  });

  it("rejects invalid collector events", () => {
    const result = validateCollectorEvent({
      event_id: "",
      workspace_id: "ws_1",
      source_type: "collector",
      event_type: "baseline",
      occurred_at: "2026-04-20T00:00:00.000Z",
      payload: {},
      source_path: ".agents/registry/roles.json",
      content_hash: "sha256:test",
    });

    expect(result.success).toBe(false);
  });
});
