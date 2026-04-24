import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";

const {
  redirectIfAuthenticatedMock,
  sanitizeRedirectTargetMock,
  resolveDefaultWorkspaceSlugMock,
} = vi.hoisted(() => ({
  redirectIfAuthenticatedMock: vi.fn(async () => {}),
  sanitizeRedirectTargetMock: vi.fn((value: string) => value),
  resolveDefaultWorkspaceSlugMock: vi.fn(),
}));

vi.mock("@/components/auth/login-form", () => ({
  LoginForm: ({
    nextPath,
    notice,
  }: {
    nextPath: string;
    notice?: string;
  }) => (
    <div
      data-next-path={nextPath}
      data-notice={notice ?? ""}
    >
      登录表单
    </div>
  ),
}));

vi.mock("@/components/auth/login-hero", () => ({
  LoginHero: () => <div>登录头图</div>,
}));

vi.mock("@/lib/auth/local-accounts", () => ({
  getLoginAccountHints: () => [],
}));

vi.mock("@/lib/auth/server", () => ({
  redirectIfAuthenticated: redirectIfAuthenticatedMock,
  sanitizeRedirectTarget: sanitizeRedirectTargetMock,
}));

vi.mock("@/lib/workspace-context/server", () => ({
  resolveDefaultWorkspaceSlug: resolveDefaultWorkspaceSlugMock,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    redirectIfAuthenticatedMock.mockClear();
    sanitizeRedirectTargetMock.mockClear();
    resolveDefaultWorkspaceSlugMock.mockReset();
  });

  it("在未指定 next 时默认跳到默认工作区工作台", async () => {
    resolveDefaultWorkspaceSlugMock.mockResolvedValue("demo-workspace");

    const view = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    render(view);

    expect(sanitizeRedirectTargetMock).toHaveBeenCalledWith("/w/demo-workspace");
    expect(redirectIfAuthenticatedMock).toHaveBeenCalledWith("/w/demo-workspace");
    expect(screen.getByText("登录表单")).toHaveAttribute(
      "data-next-path",
      "/w/demo-workspace",
    );
  });

  it("在没有默认工作区时回退到工作区列表", async () => {
    resolveDefaultWorkspaceSlugMock.mockResolvedValue(null);

    const view = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    render(view);

    expect(sanitizeRedirectTargetMock).toHaveBeenCalledWith("/workspaces");
    expect(screen.getByText("登录表单")).toHaveAttribute(
      "data-next-path",
      "/workspaces",
    );
  });
});
