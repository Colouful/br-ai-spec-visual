import { describe, expect, it } from "vitest";

import { getStatusBadge } from "@/lib/view-models/status";

describe("getStatusBadge", () => {
  it("maps active run states to emphasized badges", () => {
    expect(getStatusBadge("running")).toEqual({
      label: "运行中",
      tone: "lime",
      pulse: true,
    });
  });

  it("maps approval workflow states to review labels", () => {
    expect(getStatusBadge("review")).toEqual({
      label: "评审中",
      tone: "amber",
      pulse: false,
    });
  });

  it("maps degraded workspace health to warning labels", () => {
    expect(getStatusBadge("warning")).toEqual({
      label: "需关注",
      tone: "amber",
      pulse: false,
    });
  });
});
