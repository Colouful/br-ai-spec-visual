import { badRequest } from "./errors";
import { defaultPrivacyGuard, type PrivacyGuard } from "./privacy-guard";
import {
  createRecordId,
  defaultCollectorStore,
  nowIsoString,
  type CollectorStore,
} from "./repository";
import type { VisualHistoryItemRecord } from "./types";

export class HistoryService {
  constructor(
    private readonly store: CollectorStore = defaultCollectorStore,
    private readonly privacyGuard: PrivacyGuard = defaultPrivacyGuard,
  ) {}

  collect(input: Record<string, unknown>) {
    this.privacyGuard.assertSafe(input);
    const historyId = String(input.historyId ?? "");
    const projectId = String(input.projectId ?? "");
    if (!historyId) throw badRequest("historyId 为必填字段。");
    if (!projectId) throw badRequest("projectId 为必填字段。");

    const existing = this.store.historyItems.get(historyId);
    if (existing) {
      return { history: existing, idempotent: true };
    }

    const changedFiles = Array.isArray(input.changedFiles) ? input.changedFiles : [];
    for (const file of changedFiles) {
      if (file && typeof file === "object" && "path" in file) {
        this.privacyGuard.assertRelativePath(String((file as { path?: unknown }).path ?? ""));
      }
    }

    const timestamp = nowIsoString();
    const history: VisualHistoryItemRecord = {
      id: createRecordId("vhist"),
      historyId,
      runId: input.runId ? String(input.runId) : null,
      projectId,
      title: String(input.title ?? ""),
      summary: String(input.summary ?? ""),
      changedFiles,
      assetsUsed: Array.isArray(input.assetsUsed) ? input.assetsUsed : [],
      verificationSummary: asObject(input.verificationSummary),
      createdAt: input.createdAt ? String(input.createdAt) : timestamp,
      updatedAt: timestamp,
    };
    this.store.historyItems.set(historyId, history);
    return { history, idempotent: false };
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
