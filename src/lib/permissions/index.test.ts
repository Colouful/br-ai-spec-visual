import { describe, expect, it } from "vitest";

import { canAccessRole, hasPermission } from "./index";

describe("permission rules", () => {
  it("allows higher roles to access lower permission tiers", () => {
    expect(hasPermission("admin", "admin")).toBe(true);
    expect(hasPermission("admin", "maintainer")).toBe(true);
    expect(hasPermission("maintainer", "viewer")).toBe(true);
  });

  it("blocks lower roles from elevated access", () => {
    expect(hasPermission("viewer", "maintainer")).toBe(false);
    expect(hasPermission("maintainer", "admin")).toBe(false);
  });

  it("handles role checks with optional role values", () => {
    expect(canAccessRole(undefined, "viewer")).toBe(false);
    expect(canAccessRole("viewer", "viewer")).toBe(true);
  });
});
