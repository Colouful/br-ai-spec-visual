import { describe, expect, it } from "vitest";

import {
  canManageWorkspace,
  canOperateControl,
  canTriggerSync,
  getAllowedNavigation,
} from "./permissions";

describe("permissions", () => {
  it("allows viewer to inspect but not mutate", () => {
    expect(canTriggerSync("viewer")).toBe(false);
    expect(canOperateControl("viewer")).toBe(false);
    expect(canManageWorkspace("viewer")).toBe(false);
  });

  it("allows maintainer to trigger sync but not manage tokens", () => {
    expect(canTriggerSync("maintainer")).toBe(true);
    expect(canOperateControl("maintainer")).toBe(true);
    expect(canManageWorkspace("maintainer")).toBe(false);
  });

  it("allows admin to access every navigation item", () => {
    expect(getAllowedNavigation("admin")).toEqual([
      "workspaces",
      "runs",
      "changes",
      "topology",
      "settings",
    ]);
  });
});
