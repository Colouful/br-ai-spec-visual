import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getActiveInstallationsCount,
  listActiveInstallations,
  recordInstallationActivity,
} from "./installations-presence";

describe("installations-presence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records activity and surfaces it in the active list", () => {
    recordInstallationActivity({
      installationId: "machine-a",
      hostname: "lab-01",
      command: "init",
      status: "success",
    });

    const items = listActiveInstallations();
    expect(items).toHaveLength(1);
    expect(items[0]?.installationId).toBe("machine-a");
    expect(items[0]?.hostname).toBe("lab-01");
    expect(getActiveInstallationsCount()).toBe(1);
  });

  it("expires entries older than the TTL", () => {
    recordInstallationActivity({ installationId: "old", command: "sync" });
    vi.advanceTimersByTime(2 * 60 * 1000 + 1000);
    recordInstallationActivity({ installationId: "fresh", command: "update" });

    const ids = listActiveInstallations().map((item) => item.installationId);
    expect(ids).toContain("fresh");
    expect(ids).not.toContain("old");
  });

  it("merges updates without losing prior hostname when newer payload omits it", () => {
    recordInstallationActivity({
      installationId: "m1",
      hostname: "hostA",
      username: "alice",
      command: "init",
    });
    recordInstallationActivity({
      installationId: "m1",
      command: "sync",
      status: "success",
    });

    const item = listActiveInstallations().find((entry) => entry.installationId === "m1");
    expect(item?.hostname).toBe("hostA");
    expect(item?.username).toBe("alice");
    expect(item?.lastCommand).toBe("sync");
    expect(item?.lastStatus).toBe("success");
  });
});
