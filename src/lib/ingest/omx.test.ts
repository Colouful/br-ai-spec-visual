import { describe, expect, it } from "vitest";

import { parseOmxLogFile } from "./omx";

describe("parseOmxLogFile", () => {
  it("parses turn logs into structured turns", () => {
    const result = parseOmxLogFile({
      filePath: ".omx/logs/turns-2026-04-20.jsonl",
      workspaceId: "ws_1",
      content: [
        JSON.stringify({
          timestamp: "2026-04-20T03:05:01.372Z",
          type: "agent-turn-complete",
          thread_id: "thread_1",
          turn_id: "turn_1",
          input_preview: "hello",
          output_preview: "world",
        }),
      ].join("\n"),
    });

    expect(result.turns).toEqual([
      expect.objectContaining({
        workspaceId: "ws_1",
        threadId: "thread_1",
        turnId: "turn_1",
        type: "agent-turn-complete",
      }),
    ]);
    expect(result.sessions).toEqual([]);
  });

  it("parses omx session logs into structured sessions", () => {
    const result = parseOmxLogFile({
      filePath: ".omx/logs/omx-2026-04-20.jsonl",
      workspaceId: "ws_1",
      content: [
        JSON.stringify({
          event: "session_start",
          session_id: "session_1",
          native_session_id: "native_1",
          pid: 10,
          timestamp: "2026-04-20T02:25:38.769Z",
          _ts: "2026-04-20T02:25:38.772Z",
        }),
      ].join("\n"),
    });

    expect(result.sessions).toEqual([
      expect.objectContaining({
        workspaceId: "ws_1",
        sessionId: "session_1",
        nativeSessionId: "native_1",
        event: "session_start",
      }),
    ]);
  });
});
