import {
  collectorException,
  collectorSuccess,
  defaultCollectorStore,
  RunEventService,
} from "@/server/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data = new RunEventService().collect(body);
    return collectorSuccess(data);
  } catch (error) {
    return collectorException(error);
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const runId = url.searchParams.get("runId");
    const runs = Array.from(defaultCollectorStore.runs.values()).filter(
      (run) =>
        (!projectId || run.projectId === projectId) &&
        (!runId || run.runId === runId),
    );
    const events = Array.from(defaultCollectorStore.runEvents.values()).filter(
      (event) =>
        (!projectId || event.projectId === projectId) &&
        (!runId || event.runId === runId),
    );
    const evidenceReports = Array.from(defaultCollectorStore.evidenceReports.values()).filter(
      (report) =>
        (!projectId || report.projectId === projectId) &&
        (!runId || report.runId === runId),
    );

    return collectorSuccess({ runs, events, evidenceReports });
  } catch (error) {
    return collectorException(error);
  }
}
