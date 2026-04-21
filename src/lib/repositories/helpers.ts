export function toWorkspaceKey(workspaceId?: string | null) {
  return workspaceId ?? "global";
}

export function mergeDefined<T extends object>(
  current: T,
  incoming: Partial<T>,
) {
  const next = { ...current } as T;

  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }

  return next;
}

export function maxIsoTimestamp(
  left?: string | null,
  right?: string | null,
): string | null {
  if (!left) {
    return right ?? null;
  }

  if (!right) {
    return left;
  }

  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}
