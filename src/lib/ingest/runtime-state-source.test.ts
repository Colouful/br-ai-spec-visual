import { describe, expect, it } from "vitest";

import { parseRuntimeStateSource } from "@/lib/ingest/runtime-state-source";
import { projectRuntimeStateRawEvent } from "@/lib/projectors/runtime-state-projector";

const runtimeStateFixture = JSON.stringify(
  {
    schema_version: 1,
    kind: "run-state",
    run_id: "run_20260420_001",
    status: "running",
    current_role: "frontend-implementer",
    pending_gate: null,
    trigger: {
      source: "ide-skill",
      entry: "task-orchestrator",
      raw_input: "创建一个商品组件",
    },
    task: {
      change_id: "add-product-card",
      input_kind: "natural-language",
      risk_level: "low",
    },
    flow: {
      id: "prd-to-delivery",
      name: "PRD 到交付",
    },
    plan: {
      required_roles: ["requirement-analyst", "frontend-implementer", "code-guardian"],
      activated_optional_roles: [],
      approval_gates: [],
      first_handoff: "requirement-analyst",
    },
    artifacts: {
      proposal: "openspec/changes/add-product-card/proposal.md",
      tasks: "openspec/changes/add-product-card/tasks.md",
    },
    events: [
      {
        at: "2026-04-20T12:00:00.000Z",
        type: "run-created",
        status: "planned",
        message: "task-orchestrator created run-plan",
      },
      {
        at: "2026-04-20T12:05:00.000Z",
        type: "role-handoff",
        status: "running",
        from_role: "requirement-analyst",
        to_role: "frontend-implementer",
      },
    ],
    timestamps: {
      created_at: "2026-04-20T12:00:00.000Z",
      updated_at: "2026-04-20T12:05:00.000Z",
    },
  },
  null,
  2,
);

describe("parseRuntimeStateSource", () => {
  it("creates a raw event draft from current-run.json", () => {
    const [rawEvent] = parseRuntimeStateSource({
      sourcePath: ".ai-spec/current-run.json",
      content: runtimeStateFixture,
      workspaceId: "workspace-demo",
    });

    expect(rawEvent).toMatchObject({
      workspaceId: "workspace-demo",
      sourceKind: "run-state-json",
      eventType: "runtime-state.snapshot",
      entityType: "run-state",
      entityId: "run_20260420_001",
    });
  });

  it("projects runtime-state into run state, run events and change document", () => {
    const [rawEvent] = parseRuntimeStateSource({
      sourcePath: ".ai-spec/current-run.json",
      content: runtimeStateFixture,
      workspaceId: "workspace-demo",
    });

    const projection = projectRuntimeStateRawEvent({
      ...rawEvent,
      id: rawEvent.dedupeKey,
      createdAt: "2026-04-20T12:05:00.000Z",
      projectedAt: null,
      projectionStatus: "pending",
    });

    expect(projection.runStates).toEqual([
      expect.objectContaining({
        workspaceId: "workspace-demo",
        runKey: "run_20260420_001",
        status: "running",
        lastEventType: "role-handoff",
        turnCount: 2,
      }),
    ]);
    expect(projection.runEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runKey: "run_20260420_001",
          eventType: "run-created",
        }),
        expect.objectContaining({
          runKey: "run_20260420_001",
          eventType: "role-handoff",
        }),
      ]),
    );
    expect(projection.changeDocuments).toEqual(
      expect.arrayContaining([
      expect.objectContaining({
        workspaceId: "workspace-demo",
        changeKey: "add-product-card",
        docType: "proposal",
      }),
      ]),
    );
  });
});
