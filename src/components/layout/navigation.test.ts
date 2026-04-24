import { describe, expect, it } from "vitest";

import {
  getPlatformNavigationSections,
  getWorkspaceNavigationSections,
} from "./navigation";

describe("platform navigation", () => {
  it("only exposes the workspace picker to viewer", () => {
    const labels = getPlatformNavigationSections("viewer")
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(labels).toContain("驾驶舱");
    expect(labels).toContain("工作区");
    expect(labels).not.toContain("全局成员");
    expect(labels).not.toContain("系统设置");
    expect(labels).not.toContain("用户安装使用");
  });

  it("hides governance items from maintainer", () => {
    const labels = getPlatformNavigationSections("maintainer")
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(labels).toContain("驾驶舱");
    expect(labels).toContain("工作区");
    expect(labels).not.toContain("全局成员");
    expect(labels).not.toContain("系统设置");
  });

  it("exposes governance items to admin", () => {
    const labels = getPlatformNavigationSections("admin")
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(labels).toContain("驾驶舱");
    expect(labels).toContain("工作区");
    expect(labels).toContain("全局成员");
    expect(labels).toContain("系统设置");
    expect(labels).toContain("用户安装使用");
  });
});

describe("workspace navigation", () => {
  const SLUG = "demo-workspace";

  it("includes the workbench tab and links to the workspace root path", () => {
    const sections = getWorkspaceNavigationSections("viewer", SLUG);
    const items = sections.flatMap((section) => section.items);
    const workbench = items.find((it) => it.label === "工作台");
    expect(workbench).toBeDefined();
    expect(workbench?.href).toBe(`/w/${SLUG}`);
  });

  it("hides maintainer-only artifact tabs from viewer", () => {
    const labels = getWorkspaceNavigationSections("viewer", SLUG)
      .flatMap((section) => section.items)
      .map((item) => item.label);
    expect(labels).toContain("工作台");
    expect(labels).toContain("规范");
    expect(labels).toContain("资产");
    expect(labels).toContain("拓扑");
    expect(labels).not.toContain("运行");
    expect(labels).not.toContain("变更");
    expect(labels).not.toContain("设置");
    expect(labels).not.toContain("治理");
  });

  it("exposes maintainer artifact tabs but hides workspace settings", () => {
    const labels = getWorkspaceNavigationSections("maintainer", SLUG)
      .flatMap((section) => section.items)
      .map((item) => item.label);
    expect(labels).toContain("运行");
    expect(labels).toContain("变更");
    expect(labels).not.toContain("设置");
  });

  it("exposes every workspace tab to admin", () => {
    const labels = getWorkspaceNavigationSections("admin", SLUG)
      .flatMap((section) => section.items)
      .map((item) => item.label);
    expect(labels).toContain("工作台");
    expect(labels).toContain("流水线");
    expect(labels).toContain("资产");
    expect(labels).toContain("设置");
    expect(labels).toContain("成员");
    expect(labels).toContain("治理");
  });
});
