import { describe, expect, it } from "vitest";

import {
  decodeSessionToken,
  encodeSessionToken,
  type SessionPayload,
} from "./session-codec";

const FIXED_SECRET = "test-session-secret";

describe("session codec", () => {
  it("round-trips a session payload", () => {
    const payload: SessionPayload = {
      email: "admin@local",
      expiresAt: "2026-05-01T00:00:00.000Z",
      id: "local-admin",
      name: "控制台管理员",
      role: "admin",
    };

    const token = encodeSessionToken(payload, FIXED_SECRET);

    expect(decodeSessionToken(token, FIXED_SECRET)).toEqual(payload);
  });

  it("rejects tampered session tokens", () => {
    const payload: SessionPayload = {
      email: "viewer@local",
      expiresAt: "2026-05-01T00:00:00.000Z",
      id: "local-viewer",
      name: "只读观察者",
      role: "viewer",
    };

    const token = encodeSessionToken(payload, FIXED_SECRET);
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    expect(decodeSessionToken(tampered, FIXED_SECRET)).toBeNull();
  });
});
