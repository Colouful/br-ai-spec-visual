import { describe, expect, it } from "vitest";

import { getNavigationSections } from "./navigation";

describe("role navigation", () => {
  it("shows only observer navigation for viewer", () => {
    const viewerLabels = getNavigationSections("viewer")
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(viewerLabels).toContain("总览");
    expect(viewerLabels).toContain("规范资产");
    expect(viewerLabels).not.toContain("成员管理");
    expect(viewerLabels).not.toContain("系统设置");
  });

  it("exposes delivery tools to maintainer but hides admin settings", () => {
    const maintainerLabels = getNavigationSections("maintainer")
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(maintainerLabels).toContain("执行看板");
    expect(maintainerLabels).toContain("规范资产");
    expect(maintainerLabels).not.toContain("成员管理");
  });

  it("shows every navigation item to admin", () => {
    const adminLabels = getNavigationSections("admin")
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(adminLabels).toContain("成员管理");
    expect(adminLabels).toContain("系统设置");
  });
});
