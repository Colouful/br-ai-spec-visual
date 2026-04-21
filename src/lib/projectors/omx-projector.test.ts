/* @vitest-environment node */

import { describe, expect, it } from "vitest";

import { parseOmxJsonlSource } from "@/lib/ingest/omx-jsonl-source";
import { projectOmxRawEvent } from "@/lib/projectors/omx-projector";

const turnsFixture = [
  JSON.stringify({
    timestamp: "2026-04-20T02:27:04.754Z",
    type: "agent-turn-complete",
    thread_id: "thread-1",
    turn_id: "turn-1",
    input_preview: "用户输入",
    output_preview: "代理输出",
  }),
].join("\n");

describe("projectOmxRawEvent", () => {
  it("maps omx turn events into omx sessions, turns, run events, and run states", () => {
    const [rawEvent] = parseOmxJsonlSource({
      sourcePath: ".omx/logs/turns-2026-04-20.jsonl",
      content: turnsFixture,
    });

    const projection = projectOmxRawEvent(rawEvent);

    expect(projection.omxSessions).toEqual([
      expect.objectContaining({
        sessionKey: "thread-1",
      }),
    ]);
    expect(projection.omxTurns).toEqual([
      expect.objectContaining({
        sessionKey: "thread-1",
        turnKey: "turn-1",
        inputPreview: "用户输入",
        outputPreview: "代理输出",
      }),
    ]);
    expect(projection.runEvents).toEqual([
      expect.objectContaining({
        runKey: "thread-1",
        eventType: "agent-turn-complete",
      }),
    ]);
    expect(projection.runStates).toEqual([
      expect.objectContaining({
        runKey: "thread-1",
        lastEventType: "agent-turn-complete",
        turnCount: 1,
      }),
    ]);
  });
});
