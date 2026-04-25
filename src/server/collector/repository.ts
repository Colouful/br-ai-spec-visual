import { nanoid } from "nanoid";
import type {
  VisualHistoryItemRecord,
  VisualIncidentRecord,
  VisualProjectRecord,
  VisualRunRecord,
  VisualRuntimeEventRecord,
} from "./types";

export type CollectorStore = {
  projectStateEvents: Map<string, string>;
  runEvents: Map<string, VisualRuntimeEventRecord>;
  projects: Map<string, VisualProjectRecord>;
  runs: Map<string, VisualRunRecord>;
  historyItems: Map<string, VisualHistoryItemRecord>;
  incidents: Map<string, VisualIncidentRecord>;
};

export function nowIsoString() {
  return new Date().toISOString();
}

export function createCollectorStore(): CollectorStore {
  return {
    projectStateEvents: new Map(),
    runEvents: new Map(),
    projects: new Map(),
    runs: new Map(),
    historyItems: new Map(),
    incidents: new Map(),
  };
}

export function createRecordId(prefix: string) {
  return `${prefix}_${nanoid(12)}`;
}

export const defaultCollectorStore = createCollectorStore();

export function resetDefaultCollectorStore() {
  defaultCollectorStore.projectStateEvents.clear();
  defaultCollectorStore.runEvents.clear();
  defaultCollectorStore.projects.clear();
  defaultCollectorStore.runs.clear();
  defaultCollectorStore.historyItems.clear();
  defaultCollectorStore.incidents.clear();
}
