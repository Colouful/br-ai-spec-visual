import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";

const refresh = vi.fn();
let fetchMock: ReturnType<typeof vi.fn>;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly url: string;

  readonly listeners = new Map<string, Array<(event?: MessageEvent) => void>>();

  closed = false;

  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event?: MessageEvent) => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(handler);
    this.listeners.set(type, list);
  }

  removeEventListener(type: string, handler: (event?: MessageEvent) => void) {
    const list = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      list.filter((item) => item !== handler),
    );
  }

  send(payload: string) {
    this.sentMessages.push(payload);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, event?: MessageEvent) {
    for (const handler of this.listeners.get(type) ?? []) {
      handler(event);
    }
  }
}

describe("RealtimeWorkspaceBridge", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    refresh.mockReset();
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            websocket_url: "http://127.0.0.1:3200/ws",
            agent_id: "browser-workspace-demo",
            connect_token: "token-demo",
            capabilities: ["subscribe:events"],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not reconnect when rerendered with the same subscription props", async () => {
    const onEvent = vi.fn();
    const { rerender } = render(
      <RealtimeWorkspaceBridge
        label="运行订阅"
        workspaceIds={["workspace-demo"]}
        onEvent={onEvent}
      />,
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    });

    const initialInstances = MockWebSocket.instances.length;

    await act(async () => {
      rerender(
        <RealtimeWorkspaceBridge
          label="运行订阅"
          workspaceIds={["workspace-demo"]}
          onEvent={onEvent}
        />,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(MockWebSocket.instances.length).toBe(initialInstances);
    expect(MockWebSocket.instances.at(-1)?.closed).toBe(false);
  });
});
