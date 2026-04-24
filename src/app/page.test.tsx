import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

const { redirectMock, resolveDefaultWorkspaceSlugMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  resolveDefaultWorkspaceSlugMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/workspace-context/server", () => ({
  resolveDefaultWorkspaceSlug: resolveDefaultWorkspaceSlugMock,
}));

describe("HomePage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    resolveDefaultWorkspaceSlugMock.mockReset();
  });

  it("把根路由导向默认工作区工作台", async () => {
    resolveDefaultWorkspaceSlugMock.mockResolvedValue("demo-workspace");

    await HomePage();

    expect(resolveDefaultWorkspaceSlugMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/w/demo-workspace");
  });

  it("在没有默认工作区时导向工作区列表", async () => {
    resolveDefaultWorkspaceSlugMock.mockResolvedValue(null);

    await HomePage();

    expect(redirectMock).toHaveBeenCalledWith("/workspaces");
  });
});
