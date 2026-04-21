import { prisma } from "@/lib/db/prisma";
import { errorResponse, jsonResponse } from "@/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspace_id");
    if (!workspaceId) {
      return jsonResponse({ items: [] });
    }
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 200);

    const events = await prisma.runEvent.findMany({
      where: { workspaceId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    return jsonResponse({
      items: events.map((event) => ({
        id: event.id,
        runKey: event.runKey,
        eventType: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        payload:
          typeof event.payload === "object" && event.payload !== null
            ? event.payload
            : null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
