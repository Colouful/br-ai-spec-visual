import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type Conflict = {
  parent: string;
  segments: string[];
};

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));

function isDynamicSegment(name: string) {
  return name.startsWith("[") && name.endsWith("]");
}

function findSiblingDynamicRouteConflicts(dir: string): Conflict[] {
  const entries = readdirSync(dir, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );
  const conflicts: Conflict[] = [];
  const dynamicSegments = entries
    .map((entry) => entry.name)
    .filter(isDynamicSegment)
    .sort();

  if (dynamicSegments.length > 1) {
    conflicts.push({
      parent: path.relative(APP_DIR, dir) || ".",
      segments: dynamicSegments,
    });
  }

  for (const entry of entries) {
    conflicts.push(
      ...findSiblingDynamicRouteConflicts(path.join(dir, entry.name)),
    );
  }

  return conflicts;
}

describe("app routing", () => {
  it("does not define conflicting sibling dynamic route segments", () => {
    expect(findSiblingDynamicRouteConflicts(APP_DIR)).toEqual([]);
  });
});
