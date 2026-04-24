import { describe, expect, it } from "vitest";

import {
  buildGateOutboxPayload,
  mapGateDecisionToOutboxCommand,
} from "@/server/gate-approval";

describe("gate approval dispatch mapping", () => {
  it("将 request-changes 映射为 reject_gate，并保留 request_changes 语义", () => {
    expect(mapGateDecisionToOutboxCommand("request-changes")).toBe("reject_gate");

    expect(
      buildGateOutboxPayload({
        decision: "request-changes",
        gateType: "before-archive",
        runId: "run-001",
        comment: "请补齐归档清单和说明文档",
        reviewer: "maintainer@local",
        requestedAssets: ["openspec/changes/change-001/checklist.md"],
      }),
    ).toMatchObject({
      gate: "before-archive",
      run_id: "run-001",
      decision: "request_changes",
      reason: "请补齐归档清单和说明文档",
      requested_assets: ["openspec/changes/change-001/checklist.md"],
      requested_by: "maintainer@local",
    });
  });
});
