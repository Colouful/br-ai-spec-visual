import { describe, expect, it } from "vitest";

import { formatDuration, formatRelativeTime } from "@/lib/view-models/formatters";

describe("formatDuration", () => {
  it("formats multi-hour durations for console cards", () => {
    expect(formatDuration(4 * 60 * 60 * 1000 + 37 * 60 * 1000)).toBe("4h 37m");
  });

  it("keeps short durations readable without seconds noise", () => {
    expect(formatDuration(16 * 60 * 1000)).toBe("16m");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-04-20T12:00:00.000Z");

  it("returns compact future-safe labels for recent events", () => {
    expect(
      formatRelativeTime("2026-04-20T11:45:00.000Z", {
        now,
      }),
    ).toBe("15m ago");
  });

  it("falls back to date plus time for older events", () => {
    expect(
      formatRelativeTime("2026-04-17T05:30:00.000Z", {
        now,
      }),
    ).toBe("Apr 17, 05:30");
  });
});
