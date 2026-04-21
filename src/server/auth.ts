import { cookies } from 'next/headers';

import { authenticateLocalUser } from '@/lib/auth/local-accounts';

import { HttpError } from './http.ts';
import { destroySession, getSession, createSession, type SessionUser } from './repository.ts';
import { getRuntime } from './runtime.ts';

const sessionCookieName = 'br_ai_spec_visual_session';

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  };
}

export async function loginWithPassword(input: {
  email?: string;
  password?: string;
}): Promise<SessionUser> {
  if (!input.email || !input.password) {
    throw new HttpError(400, 'email and password are required');
  }

  const user = await authenticateLocalUser(input.email, input.password);
  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const runtime = getRuntime();
  const session = createSession(runtime.repository, user);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, session.id, buildCookieOptions());

  return session.user;
}

export async function logoutCurrentSession(): Promise<void> {
  const runtime = getRuntime();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(sessionCookieName)?.value;

  if (sessionId) {
    destroySession(runtime.repository, sessionId);
  }

  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const runtime = getRuntime();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(sessionCookieName)?.value;

  if (!sessionId) {
    return null;
  }

  const session = getSession(runtime.repository, sessionId);
  return session?.user ?? null;
}

export async function requireCurrentUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  return user;
}
