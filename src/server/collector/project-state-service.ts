import { badRequest } from "./errors";
import { defaultPrivacyGuard, type PrivacyGuard } from "./privacy-guard";
import {
  createRecordId,
  defaultCollectorStore,
  nowIsoString,
  type CollectorStore,
} from "./repository";
import type { VisualProjectRecord } from "./types";

export class ProjectStateService {
  constructor(
    private readonly store: CollectorStore = defaultCollectorStore,
    private readonly privacyGuard: PrivacyGuard = defaultPrivacyGuard,
  ) {}

  collect(input: Record<string, unknown>) {
    this.privacyGuard.assertSafe(input);
    const eventId = String(input.eventId ?? "");
    const projectId = String(input.projectId ?? "");
    if (!eventId) throw badRequest("eventId 为必填字段。");
    if (!projectId) throw badRequest("projectId 为必填字段。");

    const existingProjectId = this.store.projectStateEvents.get(eventId);
    if (existingProjectId) {
      return {
        project: this.store.projects.get(existingProjectId),
        idempotent: true,
      };
    }

    const existing = this.store.projects.get(projectId);
    const timestamp = nowIsoString();
    const project: VisualProjectRecord = {
      id: existing?.id ?? createRecordId("vproj"),
      projectId,
      workspaceId: input.workspaceId ? String(input.workspaceId) : existing?.workspaceId ?? null,
      projectHash: input.projectHash ? String(input.projectHash) : existing?.projectHash ?? null,
      name: input.name ? String(input.name) : existing?.name ?? null,
      type: String(input.type ?? existing?.type ?? "single"),
      techProfile: asObject(input.techProfile),
      manifest: asObject(input.manifest),
      packages: Array.isArray(input.packages) ? input.packages : [],
      lastRunId: existing?.lastRunId ?? null,
      riskLevel: existing?.riskLevel ?? null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    this.store.projects.set(projectId, project);
    this.store.projectStateEvents.set(eventId, projectId);

    return { project, idempotent: false };
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
