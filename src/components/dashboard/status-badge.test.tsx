import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/components/dashboard/status-badge";

describe("StatusBadge", () => {
  it("uses the dedicated running palette for pulsing lime badges", () => {
    render(<StatusBadge badge={{ label: "运行中", tone: "lime", pulse: true }} compact />);

    const badge = screen.getByText("运行中");
    expect(badge.className).toContain("[border-color:var(--status-running-border)]");
    expect(badge.className).toContain("[background-color:var(--status-running-bg)]");
    expect(badge.className).toContain("[color:var(--status-running-fg)]");

    const dot = badge.querySelector("span");
    expect(dot?.className).toContain("[background-color:var(--status-running-dot)]");
  });

  it("keeps the shared lime palette for non-running badges", () => {
    render(<StatusBadge badge={{ label: "已合并", tone: "lime", pulse: false }} compact />);

    const badge = screen.getByText("已合并");
    expect(badge.className).toContain("border-lime-400/20");
    expect(badge.className).toContain("bg-lime-400/10");
    expect(badge.className).toContain("text-lime-100");
  });
});
