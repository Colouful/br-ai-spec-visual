import { describe, expect, it } from "vitest";

import {
  evaluateRouteDecision,
  type RouteDecisionInput,
} from "./route-decision-shared";

function createInput(
  overrides: Partial<RouteDecisionInput> = {},
): RouteDecisionInput {
  return {
    workspaceName: "Demo Workspace",
    changeContext: "no-change",
    activeRunCount: 0,
    openChangeCount: 0,
    archivedChangeCount: 0,
    hasExplicitTargetChange: false,
    lowRisk: false,
    styleOrCopyOnly: false,
    createPageOrMock: false,
    addsApi: false,
    addsRoute: false,
    addsStore: false,
    crossModule: false,
    requiresTrace: false,
    changesScope: false,
    reviewConclusionChanged: false,
    securityOrCompliance: false,
    ...overrides,
  };
}

describe("evaluateRouteDecision", () => {
  it("routes low-risk fresh fixes to quick-fix", () => {
    const result = evaluateRouteDecision(
      createInput({
        lowRisk: true,
        styleOrCopyOnly: true,
      }),
    );

    expect(result.routeDecision).toBe("quick-fix");
    expect(result.selectedFlow).toBe("bugfix-to-verification");
    expect(result.traceMode).toBe("direct-fix");
    expect(result.enterOpenSpec).toBe(false);
  });

  it("upgrades fresh page creation to full-change", () => {
    const result = evaluateRouteDecision(
      createInput({
        lowRisk: true,
        createPageOrMock: true,
      }),
    );

    expect(result.routeDecision).toBe("full-change");
    expect(result.selectedFlow).toBe("prd-to-delivery");
    expect(result.enterOpenSpec).toBe(true);
  });

  it("routes an active open change minor fix to patch", () => {
    const result = evaluateRouteDecision(
      createInput({
        changeContext: "open-change",
        openChangeCount: 1,
      }),
    );

    expect(result.routeDecision).toBe("patch");
    expect(result.selectedFlow).toBe("prd-to-delivery");
    expect(result.nextExpert).toBe("frontend-implementer");
  });

  it("routes scope changes inside an open change to scope-delta", () => {
    const result = evaluateRouteDecision(
      createInput({
        changeContext: "open-change",
        openChangeCount: 1,
        changesScope: true,
      }),
    );

    expect(result.routeDecision).toBe("scope-delta");
    expect(result.nextExpert).toBe("requirement-analyst");
    expect(result.reconcileStrategy).toBe("rewind-to-requirement");
  });

  it("requests waiting-confirm when multiple open changes exist but target is unclear", () => {
    const result = evaluateRouteDecision(
      createInput({
        changeContext: "open-change",
        openChangeCount: 2,
      }),
    );

    expect(result.routeDecision).toBe("waiting-confirm");
    expect(result.selectedFlow).toBe(null);
    expect(result.warnings[0]).toContain("未归档 change");
  });

  it("routes before-archive fixes to archive-fix", () => {
    const result = evaluateRouteDecision(
      createInput({
        changeContext: "before-archive",
      }),
    );

    expect(result.routeDecision).toBe("archive-fix");
    expect(result.selectedFlow).toBe("prd-to-delivery");
    expect(result.traceMode).toBe("same-change");
  });

  it("routes archived change updates to followup-patch", () => {
    const result = evaluateRouteDecision(
      createInput({
        changeContext: "archived-change",
        archivedChangeCount: 1,
      }),
    );

    expect(result.routeDecision).toBe("followup-patch");
    expect(result.traceMode).toBe("followup-change");
    expect(result.selectedFlow).toBe("prd-to-delivery");
  });
});
