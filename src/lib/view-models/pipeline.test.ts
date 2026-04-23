import { describe, expect, it } from "vitest";

import {
  PIPELINE_STAGE_ORDER,
  shouldHideStaleRunFromPipeline,
  toPipelineStage,
  type PipelineStageId,
} from "./pipeline";

function expectStage(stage: PipelineStageId, expected: PipelineStageId) {
  expect(PIPELINE_STAGE_ORDER).toContain(stage);
  expect(stage).toBe(expected);
}

describe("toPipelineStage(run)", () => {
  it("maps completed/success/archived runs to archive", () => {
    for (const status of ["completed", "success", "archived"]) {
      expectStage(
        toPipelineStage({
          kind: "run",
          status,
          lastEventType: "run.state",
          pendingGate: null,
          currentRole: null,
        }),
        "archive",
      );
    }
  });

  it("maps run.completed event to archive even if status is missing", () => {
    expectStage(
      toPipelineStage({
        kind: "run",
        status: null,
        lastEventType: "run.completed",
        pendingGate: null,
        currentRole: null,
      }),
      "archive",
    );
  });

  it("maps runs awaiting a gate to review", () => {
    expectStage(
      toPipelineStage({
        kind: "run",
        status: "running",
        lastEventType: "gate.requested",
        pendingGate: "spec.guardian",
        currentRole: "guardian",
      }),
      "review",
    );
  });

  it("keeps gate-cleared running runs in the run stage", () => {
    expectStage(
      toPipelineStage({
        kind: "run",
        status: "running",
        lastEventType: "gate-cleared",
        pendingGate: null,
        currentRole: "frontend-implementer",
      }),
      "run",
    );
  });

  it("maps awaiting_review status to review even without a pending gate", () => {
    expectStage(
      toPipelineStage({
        kind: "run",
        status: "awaiting_review",
        lastEventType: "run.state",
        pendingGate: null,
        currentRole: null,
      }),
      "review",
    );
  });

  it("maps queued/planned/observed runs to plan", () => {
    for (const status of ["queued", "planned", "observed"]) {
      expectStage(
        toPipelineStage({
          kind: "run",
          status,
          lastEventType: "run.queued",
          pendingGate: null,
          currentRole: null,
        }),
        "plan",
      );
    }
  });

  it("falls back to run for unknown active states", () => {
    expectStage(
      toPipelineStage({
        kind: "run",
        status: "running",
        lastEventType: "run.state",
        pendingGate: null,
        currentRole: null,
      }),
      "run",
    );
  });
});

describe("toPipelineStage(change)", () => {
  it("maps archived changes to archive", () => {
    expectStage(
      toPipelineStage({
        kind: "change",
        docType: "spec",
        status: null,
        archivedAt: new Date(),
      }),
      "archive",
    );
  });

  it("maps merged status to archive", () => {
    expectStage(
      toPipelineStage({
        kind: "change",
        docType: "spec",
        status: "merged",
        archivedAt: null,
      }),
      "archive",
    );
  });

  it("maps review/guardian status to review", () => {
    for (const status of ["review", "guardian", "awaiting_review"]) {
      expectStage(
        toPipelineStage({
          kind: "change",
          docType: "spec",
          status,
          archivedAt: null,
        }),
        "review",
      );
    }
  });

  it("maps tasks docType to plan", () => {
    expectStage(
      toPipelineStage({
        kind: "change",
        docType: "tasks",
        status: null,
        archivedAt: null,
      }),
      "plan",
    );
  });

  it("maps proposal/design/spec/delta docType to spec", () => {
    for (const docType of ["proposal", "design", "spec", "spec.delta"]) {
      expectStage(
        toPipelineStage({
          kind: "change",
          docType,
          status: null,
          archivedAt: null,
        }),
        "spec",
      );
    }
  });

  it("maps implementation/running status to run", () => {
    expectStage(
      toPipelineStage({
        kind: "change",
        docType: "spec",
        status: "implementation",
        archivedAt: null,
      }),
      "run",
    );
  });

  it("defaults unknown change docs to spec (the funnel head)", () => {
    expectStage(
      toPipelineStage({
        kind: "change",
        docType: "notes",
        status: null,
        archivedAt: null,
      }),
      "spec",
    );
  });
});

describe("shouldHideStaleRunFromPipeline", () => {
  const hour = 60 * 60 * 1000;
  const now = new Date("2026-01-20T12:00:00.000Z");

  it("hides stale run in run column when over max age", () => {
    const last = new Date(now.getTime() - 25 * hour);
    expect(
      shouldHideStaleRunFromPipeline(
        { kind: "run", stage: "run", lastOccurredAt: last, now },
        24 * hour,
      ),
    ).toBe(true);
  });

  it("does not hide when within max age", () => {
    const last = new Date(now.getTime() - 1 * hour);
    expect(
      shouldHideStaleRunFromPipeline(
        { kind: "run", stage: "run", lastOccurredAt: last, now },
        24 * hour,
      ),
    ).toBe(false);
  });

  it("does not hide change cards in run column (implementation status)", () => {
    const last = new Date(now.getTime() - 100 * hour);
    expect(
      shouldHideStaleRunFromPipeline(
        { kind: "change", stage: "run", lastOccurredAt: last, now },
        24 * hour,
      ),
    ).toBe(false);
  });

  it("does not hide run cards in other stages (e.g. review)", () => {
    const last = new Date(now.getTime() - 100 * hour);
    expect(
      shouldHideStaleRunFromPipeline(
        { kind: "run", stage: "review", lastOccurredAt: last, now },
        24 * hour,
      ),
    ).toBe(false);
  });
});
