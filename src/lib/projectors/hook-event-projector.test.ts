/* @vitest-environment node */

import { describe, expect, it } from "vitest";

import type { StoredRawIngestEvent } from "@/lib/contracts/ingest";
import { projectHookEventRawEvent } from "@/lib/projectors/hook-event-projector";

describe("projectHookEventRawEvent", () => {
  it("projects full run.state_changed payload into run state, run events, and change documents", () => {
    const rawEvent: StoredRawIngestEvent = {
      id: "raw_hook_1",
      workspaceId: "test-workspace",
      sourceKind: "hook-event",
      sourcePath: "internal/visual-hooks",
      eventType: "run.state_changed",
      eventKey: "run_1:run.state_changed:1",
      dedupeKey: "dedupe-hook-1",
      checksum: "checksum-hook-1",
      occurredAt: "2026-04-22T09:05:00.000Z",
      entityType: "run",
      entityId: "run_1",
      payload: {
        run_id: "run_1",
        status: "success",
        current_role: "archive-change",
        task: {
          change_id: "add-login-page",
        },
        artifacts: {
          proposal: "openspec/changes/add-login-page/proposal.md",
          tasks: "openspec/changes/add-login-page/tasks.md",
        },
        events: [
          {
            at: "2026-04-22T09:00:00.000Z",
            type: "run-created",
          },
          {
            at: "2026-04-22T09:05:00.000Z",
            type: "run-completed",
          },
        ],
        timestamps: {
          updated_at: "2026-04-22T09:05:00.000Z",
        },
      },
      createdAt: "2026-04-22T09:05:01.000Z",
      projectedAt: null,
      projectionStatus: "pending",
    };

    const projection = projectHookEventRawEvent(rawEvent);

    expect(projection.runStates).toEqual([
      expect.objectContaining({
        workspaceId: "test-workspace",
        runKey: "run_1",
        status: "completed",
        lastEventType: "run-completed",
        turnCount: 2,
      }),
    ]);
    expect(projection.runEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runKey: "run_1",
          eventType: "run-created",
        }),
        expect.objectContaining({
          runKey: "run_1",
          eventType: "run-completed",
        }),
      ]),
    );
    expect(projection.changeDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workspaceId: "test-workspace",
          changeKey: "add-login-page",
          docType: "proposal",
        }),
        expect.objectContaining({
          workspaceId: "test-workspace",
          changeKey: "add-login-page",
          docType: "tasks",
        }),
      ]),
    );
  });
});
