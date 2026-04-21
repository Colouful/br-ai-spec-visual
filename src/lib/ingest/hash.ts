import crypto from "node:crypto";

export function toContentHash(value: string) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}
