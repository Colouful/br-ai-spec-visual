import { ingestRawEvents } from "@/lib/ingest/ingest-service";
import { PrismaIngestRepository } from "@/lib/repositories/prisma-ingest-repository";
import { prisma } from "@/lib/db/prisma";

export async function ensureWorkspaceRecord(input: {
  workspaceId: string;
  rootPath?: string | null;
}) {
  return prisma.workspace.upsert({
    where: { id: input.workspaceId },
    update: {
      rootPath: input.rootPath ?? undefined,
      status: "active",
    },
    create: {
      id: input.workspaceId,
      slug: input.workspaceId,
      name: input.workspaceId,
      rootPath: input.rootPath ?? undefined,
      status: "active",
    },
  });
}

export async function ingestWorkspaceRawEvents(input: {
  workspaceId: string;
  rootPath?: string | null;
  rawEvents: Parameters<typeof ingestRawEvents>[0]["rawEvents"];
}) {
  await ensureWorkspaceRecord({
    workspaceId: input.workspaceId,
    rootPath: input.rootPath ?? null,
  });

  const repository = new PrismaIngestRepository();
  return ingestRawEvents({
    repository,
    rawEvents: input.rawEvents.map((event) => ({
      ...event,
      workspaceId: event.workspaceId ?? input.workspaceId,
    })),
  });
}
