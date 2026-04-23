import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UsageGuidePage } from "@/components/guide/usage-guide-page";

vi.mock("@/components/dashboard/console-page", () => ({
  ConsolePage: ({
    actions,
    children,
    hero,
  }: {
    actions?: ReactNode;
    children: ReactNode;
    hero: { title: string };
    statsVariant?: "default" | "guide";
  }) => (
    <div>
      <h1>{hero.title}</h1>
      {actions}
      {children}
    </div>
  ),
}));

describe("UsageGuidePage", () => {
  it(
    "shows the key platform and workspace guide sections",
    () => {
      render(<UsageGuidePage />);

      expect(
        screen.getByRole("heading", {
          name: "5 分钟看懂 br-ai-spec-visual 的页面结构与使用路径",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "平台模块" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "工作区模块" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "返回驾驶舱" })).toHaveAttribute(
        "href",
        "/overview",
      );
    },
    15_000,
  );
});
