function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDuration(durationMs: number): string {
  if (durationMs < 60_000) {
    return "<1m";
  }

  const totalMinutes = Math.floor(durationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatRelativeTime(
  value: Date | string,
  options: {
    now?: Date;
    timeZone?: string;
  } = {},
): string {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? "UTC";
  const date = toDate(value);
  const diffMs = now.getTime() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }

  if (diffMs < 3 * day) {
    return `${Math.floor(diffMs / day)}d ago`;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.month} ${values.day}, ${values.hour}:${values.minute}`;
}

export function formatTimestamp(
  value: Date | string,
  options: {
    timeZone?: string;
  } = {},
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: options.timeZone ?? "Asia/Shanghai",
  });

  const parts = formatter.formatToParts(toDate(value));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.month} ${values.day}, ${values.hour}:${values.minute}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNameList(items: string[]): string {
  if (items.length <= 2) {
    return items.join(" · ");
  }

  return `${items.slice(0, 2).join(" · ")} +${items.length - 2}`;
}
