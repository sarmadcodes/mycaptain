import 'server-only';

import { cookies } from 'next/headers';

// Backend-for-frontend session: the partner's tokens live in httpOnly cookies the browser's
// JavaScript cannot read. Every API call goes through this server, which adds the token.

export const API_URL = process.env.API_URL ?? 'http://localhost:4000/api/v1';

const ACCESS = 'mcp_at';
const REFRESH = 'mcp_rt';
const secure = process.env.NODE_ENV === 'production';

export type Session = { accessToken: string; refreshToken: string; user: { id: string; role: string; name: string } };

export async function saveSession(s: Pick<Session, 'accessToken' | 'refreshToken'>) {
  const jar = await cookies();
  const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };
  jar.set(ACCESS, s.accessToken, { ...base, maxAge: 15 * 60 });
  jar.set(REFRESH, s.refreshToken, { ...base, maxAge: 30 * 24 * 3600 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

export async function readSession() {
  const jar = await cookies();
  return { access: jar.get(ACCESS)?.value, refresh: jar.get(REFRESH)?.value };
}

// Swaps the refresh token for a new pair; returns the new access token or null.
export async function refreshSession(): Promise<string | null> {
  const { refresh } = await readSession();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
    cache: 'no-store',
  }).catch(() => null);
  if (!res) return null;
  if (!res.ok) {
    if (res.status === 401) await clearSession();
    return null;
  }
  const s = (await res.json()) as Session;
  if (s.user.role !== 'partner') {
    await clearSession();
    return null;
  }
  await saveSession(s);
  return s.accessToken;
}

// Current access token, refreshing when the short-lived one has expired.
export async function accessToken() {
  const { access } = await readSession();
  return access ?? (await refreshSession());
}
