import { badRequest } from "./errors";
import { defaultPrivacyGuard, type PrivacyGuard } from "./privacy-guard";
import {
  createRecordId,
  defaultCollectorStore,
  nowIsoString,
  type CollectorStore,
} from "./repository";
import type { VisualEvidenceReportRecord, VisualRunRecord } from "./types";

const FINAL_STATUS = new Set(["success", "failure", "blocked", "unknown"]);

export class EvidenceReportService {
  constructor(
    private readonly store: CollectorStore = defaultCollectorStore,
    private readonly privacyGuard: PrivacyGuard = defaultPrivacyGuard,
  ) {}

  collect(input: Record<string, unknown>) {
    this.privacyGuard.assertSafe(input);
    const runId = String(input.runId ?? "");
    const projectId = String(input.projectId ?? "");
    if (!runId) throw badRequest("runId 为必填字段。");
    if (!projectId) throw badRequest("projectId 为必填字段。");

    const finalStatus = normalizeFinalStatus(input.finalStatus);
    const changedFiles = arrayOrEmpty(input.changedFiles);
    changedFiles.forEach((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return;
      const pathValue = (item as Record<string, unknown>).path;
      if (typeof pathValue === "string") {
        this.privacyGuard.assertRelativePath(pathValue);
      }
    });

    const timestamp = nowIsoString();
    const existing = this.store.evidenceReports.get(runId);
    const evidence: VisualEvidenceReportRecord = {
      id: existing?.id ?? createRecordId("vevd"),
      runId,
      projectId,
      taskId: input.taskId ? String(input.taskId) : existing?.taskId ?? null,
      specId: input.specId ? String(input.specId) : existing?.specId ?? null,
      changedFiles,
      testResults: arrayOrEmpty(input.testResults),
      hookResults: arrayOrEmpty(input.hookResults),
      repairResults: arrayOrEmpty(input.repairResults),
      reviewResults: arrayOrEmpty(input.reviewResults),
      finalStatus,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    this.store.evidenceReports.set(runId, evidence);

    const run = this.upsertRun(evidence, timestamp);
    return { evidence, run, idempotent: false };
  }

  private upsertRun(
    evidence: VisualEvidenceReportRecord,
    timestamp: string,
  ): VisualRunRecord {
    const existing = this.store.runs.get(evidence.runId);
    const run: VisualRunRecord = {
      id: existing?.id ?? createRecordId("vrun"),
      runId: evidence.runId,
      projectId: evidence.projectId,
      workspaceId: existing?.workspaceId ?? null,
      requirementSummary: existing?.requirementSummary ?? null,
      state: evidence.finalStatus,
      stage: "evidence.reported",
      executor: existing?.executor ?? null,
      manifest: existing?.manifest ?? {},
      branch: existing?.branch ?? {},
      worktree: existing?.worktree ?? {},
      contextSummary: existing?.contextSummary ?? {},
      verificationSummary: {
        changedFiles: evidence.changedFiles.length,
        hookResults: evidence.hookResults.length,
        testResults: evidence.testResults.length,
        repairResults: evidence.repairResults.length,
        reviewResults: evidence.reviewResults.length,
        finalStatus: evidence.finalStatus,
      },
      startedAt: existing?.startedAt ?? null,
      completedAt: evidence.finalStatus === "unknown" ? existing?.completedAt ?? null : timestamp,
      durationMs: existing?.durationMs ?? null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    this.store.runs.set(evidence.runId, run);
    return run;
  }
}

function normalizeFinalStatus(value: unknown): VisualEvidenceReportRecord["finalStatus"] {
  const status = String(value ?? "unknown");
  if (!FINAL_STATUS.has(status)) {
    throw badRequest("finalStatus 必须是 success、failure、blocked 或 unknown。");
  }
  return status as VisualEvidenceReportRecord["finalStatus"];
}

function arrayOrEmpty(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
