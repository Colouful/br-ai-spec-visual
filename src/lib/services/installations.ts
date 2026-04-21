import { prisma } from "@/lib/db/prisma";

export { checkRateLimit } from "./rate-limit";

export interface InstallationReportInput {
  installationId: string;
  command: string;
  status: string;
  hostname?: string | null;
  username?: string | null;
  platform?: string | null;
  arch?: string | null;
  osRelease?: string | null;
  nodeVersion?: string | null;
  cliVersion?: string | null;
  profile?: string | null;
  ides?: unknown;
  level?: string | null;
  projectHash?: string | null;
  projectName?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  occurredAt?: Date;
}

function clip(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

export async function ingestInstallationReport(input: InstallationReportInput): Promise<{
  installationId: string;
  eventId: string;
}> {
  const occurredAt = input.occurredAt ?? new Date();
  const installationId = input.installationId;

  await prisma.installation.upsert({
    where: { installationId },
    update: {
      hostname: clip(input.hostname, 255) ?? undefined,
      username: clip(input.username, 128) ?? undefined,
      platform: clip(input.platform, 64) ?? undefined,
      arch: clip(input.arch, 32) ?? undefined,
      osRelease: clip(input.osRelease, 128) ?? undefined,
      nodeVersion: clip(input.nodeVersion, 64) ?? undefined,
      lastSeenAt: occurredAt,
      lastCommand: clip(input.command, 64) ?? undefined,
      lastCliVersion: clip(input.cliVersion, 64) ?? undefined,
      totalEvents: { increment: 1 },
    },
    create: {
      installationId,
      hostname: clip(input.hostname, 255),
      username: clip(input.username, 128),
      platform: clip(input.platform, 64),
      arch: clip(input.arch, 32),
      osRelease: clip(input.osRelease, 128),
      nodeVersion: clip(input.nodeVersion, 64),
      firstSeenAt: occurredAt,
      lastSeenAt: occurredAt,
      lastCommand: clip(input.command, 64),
      lastCliVersion: clip(input.cliVersion, 64),
      totalEvents: 1,
    },
  });

  const event = await prisma.installationEvent.create({
    data: {
      installationId,
      command: clip(input.command, 64) ?? "unknown",
      status: clip(input.status, 32) ?? "unknown",
      cliVersion: clip(input.cliVersion, 64),
      profile: clip(input.profile, 64),
      ides: (input.ides as never) ?? undefined,
      level: clip(input.level, 32),
      projectHash: clip(input.projectHash, 128),
      projectName: clip(input.projectName, 255),
      durationMs:
        typeof input.durationMs === "number" && Number.isFinite(input.durationMs)
          ? Math.max(0, Math.floor(input.durationMs))
          : null,
      errorMessage: clip(input.errorMessage, 4000),
      occurredAt,
    },
    select: { id: true },
  });

  if (input.projectHash) {
    await prisma.installationProject.upsert({
      where: {
        installationId_projectHash: {
          installationId,
          projectHash: input.projectHash,
        },
      },
      update: {
        projectName: clip(input.projectName, 255) ?? undefined,
        profile: clip(input.profile, 64) ?? undefined,
        lastSeenAt: occurredAt,
        eventCount: { increment: 1 },
      },
      create: {
        installationId,
        projectHash: input.projectHash,
        projectName: clip(input.projectName, 255),
        profile: clip(input.profile, 64),
        firstSeenAt: occurredAt,
        lastSeenAt: occurredAt,
        eventCount: 1,
      },
    });
  }

  return { installationId, eventId: event.id };
}

