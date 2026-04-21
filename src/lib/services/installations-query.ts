import { prisma } from "@/lib/db/prisma";

export interface InstallationListItem {
  id: string;
  installationId: string;
  hostname: string | null;
  username: string | null;
  platform: string | null;
  osRelease: string | null;
  lastCommand: string | null;
  lastCliVersion: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  totalEvents: number;
  projectCount: number;
}

export async function listInstallations(params: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: InstallationListItem[]; total: number }> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const q = params.query?.trim();

  const where = q
    ? {
        OR: [
          { installationId: { contains: q } },
          { hostname: { contains: q } },
          { username: { contains: q } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.installation.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      take: limit,
      skip: offset,
      include: { _count: { select: { projects: true } } },
    }),
    prisma.installation.count({ where }),
  ]);

  const items: InstallationListItem[] = rows.map((row) => ({
    id: row.id,
    installationId: row.installationId,
    hostname: row.hostname,
    username: row.username,
    platform: row.platform,
    osRelease: row.osRelease,
    lastCommand: row.lastCommand,
    lastCliVersion: row.lastCliVersion,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    totalEvents: row.totalEvents,
    projectCount: row._count.projects,
  }));

  return { items, total };
}

export async function getInstallationDetail(installationId: string) {
  const installation = await prisma.installation.findUnique({
    where: { installationId },
  });
  if (!installation) return null;

  const [events, projects, commandCounts] = await Promise.all([
    prisma.installationEvent.findMany({
      where: { installationId },
      orderBy: { occurredAt: "desc" },
      take: 200,
    }),
    prisma.installationProject.findMany({
      where: { installationId },
      orderBy: { lastSeenAt: "desc" },
    }),
    prisma.installationEvent.groupBy({
      by: ["command", "status"],
      where: { installationId },
      _count: { _all: true },
    }),
  ]);

  return {
    installation: {
      id: installation.id,
      installationId: installation.installationId,
      hostname: installation.hostname,
      username: installation.username,
      platform: installation.platform,
      arch: installation.arch,
      osRelease: installation.osRelease,
      nodeVersion: installation.nodeVersion,
      firstSeenAt: installation.firstSeenAt.toISOString(),
      lastSeenAt: installation.lastSeenAt.toISOString(),
      lastCommand: installation.lastCommand,
      lastCliVersion: installation.lastCliVersion,
      totalEvents: installation.totalEvents,
    },
    events: events.map((event) => ({
      id: event.id,
      command: event.command,
      status: event.status,
      cliVersion: event.cliVersion,
      profile: event.profile,
      level: event.level,
      projectHash: event.projectHash,
      projectName: event.projectName,
      durationMs: event.durationMs,
      errorMessage: event.errorMessage,
      occurredAt: event.occurredAt.toISOString(),
    })),
    projects: projects.map((project) => ({
      id: project.id,
      projectHash: project.projectHash,
      projectName: project.projectName,
      profile: project.profile,
      eventCount: project.eventCount,
      firstSeenAt: project.firstSeenAt.toISOString(),
      lastSeenAt: project.lastSeenAt.toISOString(),
    })),
    commandStats: commandCounts.map((item) => ({
      command: item.command,
      status: item.status,
      count: item._count._all,
    })),
  };
}

export interface InstallationsStats {
  totalInstallations: number;
  totalProjects: number;
  totalEvents: number;
  dau: number;
  wau: number;
  mau: number;
  eventsToday: number;
  commandDistribution: Array<{ command: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  platformDistribution: Array<{ platform: string; count: number }>;
  cliVersionDistribution: Array<{ cliVersion: string; count: number }>;
  profileDistribution: Array<{ profile: string; count: number }>;
  dailyActive: Array<{ date: string; installations: number; events: number }>;
  newProjectsLast7d: number;
  newProjectsLast30d: number;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getInstallationsStats(): Promise<InstallationsStats> {
  const now = new Date();
  const startToday = startOfDay(now);
  const start7d = daysAgo(7);
  const start30d = daysAgo(30);

  const [
    totalInstallations,
    totalProjects,
    totalEvents,
    activeToday,
    active7d,
    active30d,
    eventsToday,
    commandRows,
    statusRows,
    platformRows,
    cliVersionRows,
    profileRows,
    recentEvents,
    newProjects7d,
    newProjects30d,
  ] = await Promise.all([
    prisma.installation.count(),
    prisma.installationProject.count(),
    prisma.installationEvent.count(),
    prisma.installationEvent.findMany({
      where: { occurredAt: { gte: startToday } },
      distinct: ["installationId"],
      select: { installationId: true },
    }),
    prisma.installationEvent.findMany({
      where: { occurredAt: { gte: start7d } },
      distinct: ["installationId"],
      select: { installationId: true },
    }),
    prisma.installationEvent.findMany({
      where: { occurredAt: { gte: start30d } },
      distinct: ["installationId"],
      select: { installationId: true },
    }),
    prisma.installationEvent.count({ where: { occurredAt: { gte: startToday } } }),
    prisma.installationEvent.groupBy({
      by: ["command"],
      _count: { _all: true },
      orderBy: { _count: { command: "desc" } },
      take: 20,
    }),
    prisma.installationEvent.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.installation.groupBy({
      by: ["platform"],
      _count: { _all: true },
    }),
    prisma.installation.groupBy({
      by: ["lastCliVersion"],
      _count: { _all: true },
      orderBy: { _count: { lastCliVersion: "desc" } },
      take: 10,
    }),
    prisma.installationProject.groupBy({
      by: ["profile"],
      _count: { _all: true },
    }),
    prisma.installationEvent.findMany({
      where: { occurredAt: { gte: start30d } },
      select: { installationId: true, occurredAt: true },
    }),
    prisma.installationProject.count({ where: { firstSeenAt: { gte: start7d } } }),
    prisma.installationProject.count({ where: { firstSeenAt: { gte: start30d } } }),
  ]);

  const dailyMap = new Map<string, { installations: Set<string>; events: number }>();
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(daysAgo(i));
    dailyMap.set(day.toISOString().slice(0, 10), {
      installations: new Set(),
      events: 0,
    });
  }
  for (const event of recentEvents) {
    const key = event.occurredAt.toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.installations.add(event.installationId);
      bucket.events += 1;
    }
  }
  const dailyActive = Array.from(dailyMap.entries()).map(([date, bucket]) => ({
    date,
    installations: bucket.installations.size,
    events: bucket.events,
  }));

  return {
    totalInstallations,
    totalProjects,
    totalEvents,
    dau: activeToday.length,
    wau: active7d.length,
    mau: active30d.length,
    eventsToday,
    commandDistribution: commandRows.map((row) => ({
      command: row.command,
      count: row._count._all,
    })),
    statusDistribution: statusRows.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
    platformDistribution: platformRows.map((row) => ({
      platform: row.platform ?? "unknown",
      count: row._count._all,
    })),
    cliVersionDistribution: cliVersionRows.map((row) => ({
      cliVersion: row.lastCliVersion ?? "unknown",
      count: row._count._all,
    })),
    profileDistribution: profileRows.map((row) => ({
      profile: row.profile ?? "unknown",
      count: row._count._all,
    })),
    dailyActive,
    newProjectsLast7d: newProjects7d,
    newProjectsLast30d: newProjects30d,
  };
}
