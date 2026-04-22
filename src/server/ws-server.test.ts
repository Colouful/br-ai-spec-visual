import { describe, expect, test } from "vitest";

import { registerConnection } from "@/server/realtime-hub";
import { getRuntime } from "@/server/runtime";
import { publishIngestProjectionEvent } from "@/server/ws-server";

function resetRuntime() {
  const runtime = getRuntime();
  runtime.hub.connections.clear();
  runtime.hub.workspaces.clear();
  runtime.sockets.clear();
  runtime.repository.workspaces.clear();
  runtime.repository.runs.clear();
  runtime.repository.changes.clear();
  runtime.repository.controls.clear();
  runtime.repository.sessions.clear();
  return runtime;
}

describe("publishIngestProjectionEvent", () => {
  test("publishes refresh event to browser subscribers in the workspace", () => {
    const runtime = resetRuntime();
    const sent: string[] = [];

    runtime.repository.workspaces.set("ws-demo", {
      id: "ws-demo",
      name: "Demo",
      root_path: "/tmp/demo",
      status: "connected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    registerConnection(runtime.hub, {
      connectionId: "browser-1",
      workspaceId: "ws-demo",
      sourceType: "browser",
      capabilities: ["subscribe:events"],
    });
    runtime.sockets.set("browser-1", {
      readyState: 1,
      send(payload: string) {
        sent.push(payload);
      },
    } as never);

    const result = publishIngestProjectionEvent("ws-demo", {
      source_path: "/api/internal/ingest/raw",
      source_kind: "hook-event",
      inserted_raw_count: 1,
      projected_raw_count: 1,
      skipped_raw_count: 0,
    });

    expect(result.delivered_connection_ids).toEqual(["browser-1"]);
    expect(sent).toHaveLength(1);
    const envelope = JSON.parse(sent[0]);
    expect(envelope.event_type).toBe("ingest.projected");
    expect(envelope.workspace_id).toBe("ws-demo");
    expect(envelope.payload).toMatchObject({
      source_kind: "hook-event",
      inserted_raw_count: 1,
      projected_raw_count: 1,
    });
  });
});
