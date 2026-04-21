import { describe, expect, it } from "vitest";

import { buildBrowserHandshake, toWebSocketUrl } from "@/lib/realtime/browser";

describe("browser realtime helpers", () => {
  it("converts http endpoint into websocket endpoint", () => {
    expect(toWebSocketUrl("http://127.0.0.1:3200/ws")).toBe("ws://127.0.0.1:3200/ws");
    expect(toWebSocketUrl("https://example.com/ws")).toBe("wss://example.com/ws");
  });

  it("builds browser handshake payload with schema-compatible hash", () => {
    const payload = buildBrowserHandshake({
      workspaceId: "workspace-demo",
      agentId: "browser-workspace-demo",
      connectToken: "token-1",
      capabilities: ["subscribe:events"],
    });

    expect(payload.workspace_id).toBe("workspace-demo");
    expect(payload.source_type).toBe("browser");
    expect(payload.event_type).toBe("session.hello");
    expect(payload.content_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
