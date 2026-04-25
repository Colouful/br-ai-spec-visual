import {
  collectorException,
  collectorSuccess,
  IncidentService,
} from "@/server/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data = new IncidentService().collect(body);
    return collectorSuccess(data);
  } catch (error) {
    return collectorException(error);
  }
}
