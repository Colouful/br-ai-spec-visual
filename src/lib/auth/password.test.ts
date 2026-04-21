import { describe, expect, it } from "vitest";

import { getPasswordIssues, isPasswordValid } from "./password";

describe("password rules", () => {
  it("accepts a strong console password", () => {
    expect(isPasswordValid("Console#2026")).toBe(true);
    expect(getPasswordIssues("Console#2026")).toEqual([]);
  });

  it("rejects a password that is too short", () => {
    expect(isPasswordValid("Ab1!xy")).toBe(false);
    expect(getPasswordIssues("Ab1!xy")).toContain("密码长度至少需要 8 位");
  });

  it("rejects a password that lacks required character groups", () => {
    expect(getPasswordIssues("console2026")).toEqual([
      "密码至少需要 1 个大写字母",
      "密码至少需要 1 个特殊字符",
    ]);
  });
});
