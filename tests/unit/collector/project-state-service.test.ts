import { describe, expect, it } from "vitest";
import { createCollectorStore, ProjectStateService } from "@/server/collector";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "evt_project_1",
    projectId: "proj_1",
    workspaceId: "ws_1",
    name: "demo",
    type: "single",
    techProfile: { domain: "frontend", frameworks: ["Next.js"], confidence: 90 },
    manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
    packages: [{ packageId: "root", path: "." }],
    privacy: {
      sourceCodeIncluded: false,
      rawPromptIncluded: false,
      rawResponseIncluded: false,
      absolutePathIncluded: false,
    },
    reportedAt: "2026-04-25T10:00:00.000Z",
    ...overrides,
  };
}

describe("ProjectStateService", () => {
  it("project-state 上报成功", () => {
    const service = new ProjectStateService(createCollectorStore());
    const result = service.collect(payload());

    expect(result.project?.projectId).toBe("proj_1");
    expect(result.project?.techProfile.frameworks).toEqual(["Next.js"]);
    expect(result.idempotent).toBe(false);
  });

  it("project-state 重复 eventId 幂等", () => {
    const store = createCollectorStore();
    const service = new ProjectStateService(store);
    const first = service.collect(payload());
    const second = service.collect(payload({ name: "changed" }));

    expect(second.idempotent).toBe(true);
    expect(second.project?.id).toBe(first.project?.id);
    expect(store.projects.size).toBe(1);
  });
});
