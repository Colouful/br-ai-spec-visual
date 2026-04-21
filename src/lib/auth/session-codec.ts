import crypto from "node:crypto";

import type { UserRole } from "@/lib/permissions";

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string;
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function encodeSessionToken(payload: SessionPayload, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function decodeSessionToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  if (sign(encodedPayload, secret) !== signature) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
  } catch {
    return null;
  }
}
