function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(",")}}`;
}

function pseudoHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const chunk = (hash >>> 0).toString(16).padStart(8, "0");
  return chunk.repeat(8).slice(0, 64);
}

export function toWebSocketUrl(input: string) {
  const url = new URL(input);
  if (url.protocol === "http:") {
    url.protocol = "ws:";
  } else if (url.protocol === "https:") {
    url.protocol = "wss:";
  }
  return url.toString();
}

export function buildBrowserHandshake(input: {
  workspaceId: string;
  agentId: string;
  connectToken: string;
  capabilities: string[];
}) {
  const payload = {
    kind: "browser-handshake",
  };
  const occurredAt = new Date().toISOString();
  const base = {
    workspace_id: input.workspaceId,
    agent_id: input.agentId,
    connect_token: input.connectToken,
    capabilities: input.capabilities,
    event_id: `evt_browser_${input.workspaceId}`,
    source_type: "browser" as const,
    event_type: "session.hello",
    occurred_at: occurredAt,
    payload,
    source_path: "browser://realtime",
  };

  return {
    ...base,
    content_hash: `sha256:${pseudoHash(stableStringify(base))}`,
  };
}
