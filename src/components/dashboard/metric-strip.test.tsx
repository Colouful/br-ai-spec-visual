import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricStrip } from "@/components/dashboard/metric-strip";

describe("MetricStrip", () => {
  it("uses larger typography in guide variant", () => {
    render(
      <MetricStrip
        items={[{ label: "平台模块", value: "6" }]}
        variant="guide"
      />,
    );

    expect(screen.getByText("平台模块")).toHaveClass("text-sm");
    expect(screen.getByText("6")).toHaveClass("text-4xl");
  });
});
