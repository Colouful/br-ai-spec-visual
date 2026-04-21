import { createHmac, timingSafeEqual } from 'node:crypto';

type ConnectTokenClaims = {
  workspace_id: string;
  agent_id: string;
  issued_at: string;
  expires_at: string;
};

type CreateConnectTokenInput = {
  workspaceId: string;
  agentId: string;
  issuedAt?: Date;
  ttlSeconds?: number;
  secret: string;
};

type ValidateConnectTokenInput = {
  token: string;
  workspaceId: string;
  agentId: string;
  now?: Date;
  secret: string;
};

type ConnectTokenSuccess = {
  ok: true;
  claims: ConnectTokenClaims;
  reason?: undefined;
};

type ConnectTokenFailure = {
  ok: false;
  reason:
    | 'malformed'
    | 'invalid_signature'
    | 'workspace_mismatch'
    | 'agent_mismatch'
    | 'expired';
  claims?: undefined;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function parseTokenClaims(token: string): ConnectTokenClaims | null {
  const [encodedClaims] = token.split('.');
  if (!encodedClaims) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(encodedClaims)) as ConnectTokenClaims;
  } catch {
    return null;
  }
}

export function createConnectToken(input: CreateConnectTokenInput): {
  token: string;
  claims: ConnectTokenClaims;
} {
  const issuedAt = input.issuedAt ?? new Date();
  const claims: ConnectTokenClaims = {
    workspace_id: input.workspaceId,
    agent_id: input.agentId,
    issued_at: issuedAt.toISOString(),
    expires_at: new Date(issuedAt.getTime() + (input.ttlSeconds ?? 300) * 1_000).toISOString(),
  };
  const payload = encodeBase64Url(JSON.stringify(claims));
  const signature = signPayload(payload, input.secret);

  return {
    token: `${payload}.${signature}`,
    claims,
  };
}

export function validateConnectToken(
  input: ValidateConnectTokenInput,
): ConnectTokenSuccess | ConnectTokenFailure {
  const [payload, signature] = input.token.split('.');

  if (!payload || !signature) {
    return { ok: false, reason: 'malformed' };
  }

  const expectedSignature = signPayload(payload, input.secret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { ok: false, reason: 'invalid_signature' };
  }

  const claims = parseTokenClaims(input.token);
  if (!claims) {
    return { ok: false, reason: 'malformed' };
  }

  if (claims.workspace_id !== input.workspaceId) {
    return { ok: false, reason: 'workspace_mismatch' };
  }

  if (claims.agent_id !== input.agentId) {
    return { ok: false, reason: 'agent_mismatch' };
  }

  const now = input.now ?? new Date();
  if (now.getTime() > new Date(claims.expires_at).getTime()) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, claims };
}
