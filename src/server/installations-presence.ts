/**
 * In-memory active-installation presence tracker.
 * Feeds /api/admin/installations/active and the admin realtime panel.
 */

export interface InstallationActivity {
  installationId: string;
  hostname?: string | null;
  username?: string | null;
  lastCommand?: string | null;
  lastStatus?: string | null;
  lastSeenAt: number;
}

const ACTIVE_TTL_MS = 2 * 60 * 1000;
const activeMap = new Map<string, InstallationActivity>();

function prune(now: number = Date.now()): void {
  for (const [key, value] of activeMap) {
    if (now - value.lastSeenAt > ACTIVE_TTL_MS) {
      activeMap.delete(key);
    }
  }
}

export function recordInstallationActivity(input: {
  installationId: string;
  command?: string | null;
  status?: string | null;
  hostname?: string | null;
  username?: string | null;
  at?: Date;
}): void {
  const at = input.at ? input.at.getTime() : Date.now();
  const prev = activeMap.get(input.installationId);
  activeMap.set(input.installationId, {
    installationId: input.installationId,
    hostname: input.hostname ?? prev?.hostname ?? null,
    username: input.username ?? prev?.username ?? null,
    lastCommand: input.command ?? prev?.lastCommand ?? null,
    lastStatus: input.status ?? prev?.lastStatus ?? null,
    lastSeenAt: at,
  });
}

export function listActiveInstallations(): InstallationActivity[] {
  prune();
  return Array.from(activeMap.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export function getActiveInstallationsCount(): number {
  prune();
  return activeMap.size;
}
