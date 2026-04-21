import { describe, expect, it } from "vitest";

import { authenticateLocalUser } from "./local-accounts";

describe("local account authentication", () => {
  it("authenticates the built-in admin demo account", async () => {
    const user = await authenticateLocalUser("admin@local", "Console#2026");

    expect(user?.role).toBe("admin");
    expect(user?.name).toBe("控制台管理员");
  });

  it("rejects invalid credentials", async () => {
    await expect(
      authenticateLocalUser("viewer@local", "wrong-password"),
    ).resolves.toBeNull();
  });
});
