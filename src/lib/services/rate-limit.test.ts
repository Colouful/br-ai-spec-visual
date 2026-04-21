import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to 5 requests per second per key", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit("install:A")).toBe(true);
    }
    expect(checkRateLimit("install:A")).toBe(false);
  });

  it("isolates buckets by key", () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit("install:A");
    }
    expect(checkRateLimit("install:A")).toBe(false);
    expect(checkRateLimit("install:B")).toBe(true);
  });

  it("resets after the window elapses", () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit("install:C");
    }
    expect(checkRateLimit("install:C")).toBe(false);
    vi.advanceTimersByTime(1_100);
    expect(checkRateLimit("install:C")).toBe(true);
  });
});
