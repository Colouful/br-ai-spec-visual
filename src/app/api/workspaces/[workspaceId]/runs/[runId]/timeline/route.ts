import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; runId: string }> },
) {
  const guard = await requireApiRole("viewer");
  if ("response" in guard) return guard.response;

  const { workspaceId, runId } = await context.params;
  const [timeline, runEvents] = await Promise.all([
    prisma.timelineEvent.findMany({
      where: { workspaceId, runId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.runEvent.findMany({
      where: { workspaceId, runKey: runId },
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    items: [
      ...timeline.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        createdAt: item.createdAt.toISOString(),
        payload: item.payload,
      })),
      ...runEvents.map((item) => ({
        id: item.id,
        type: item.eventType,
        title: item.eventType,
        createdAt: item.occurredAt.toISOString(),
        payload: item.payload,
      })),
    ].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
  });
}
