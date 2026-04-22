import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";

vi.mock("@/lib/workspace-context/server", () => ({
  listWorkspaceSummaries: vi.fn(async () => []),
}));

vi.mock("@/lib/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

vi.mock("@/components/ui/motion-primitives", () => ({
  MotionPage: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="motion-page">
      {children}
    </div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/workspaces/workspace-test/board",
}));

describe("AppShell", () => {
  it("keeps the main pane shrinkable without a page-level scroll container", async () => {
    const view = await AppShell({
      user: {
        email: "admin@example.com",
        id: "user-admin",
        name: "Admin",
        role: "admin",
      },
      children: <div>内容</div>,
    });

    const { container } = render(view);
    const motionPage = screen.getByTestId("motion-page");
    const mainPane = container.querySelector("main")?.parentElement;

    expect(mainPane).toHaveClass("min-w-0");
    expect(motionPage).not.toHaveClass("overflow-y-auto");
  });
});
