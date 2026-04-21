import { createHash } from "node:crypto";

import type { JsonRecord } from "@/lib/contracts/ingest";

export function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonRecord(content: string, sourcePath: string) {
  const parsed = JSON.parse(content) as unknown;

  if (!isJsonRecord(parsed)) {
    throw new Error(`${sourcePath} 不是 JSON 对象`);
  }

  return parsed;
}

export function parseJsonLines(content: string) {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parsed = JSON.parse(line) as unknown;

      if (!isJsonRecord(parsed)) {
        throw new Error("JSONL 行必须是对象");
      }

      return parsed;
    });
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as JsonRecord).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return `{${entries
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableStringify(entryValue)}`,
    )
    .join(",")}}`;
}

export function hashValue(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function readString(
  record: JsonRecord,
  key: string,
): string | null | undefined {
  const value = record[key];

  return typeof value === "string" ? value : undefined;
}

export function readNumber(
  record: JsonRecord,
  key: string,
): number | null | undefined {
  const value = record[key];

  return typeof value === "number" ? value : undefined;
}

export function readStringArray(record: JsonRecord, key: string) {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}
