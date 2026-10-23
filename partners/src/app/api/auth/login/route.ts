import { NextResponse } from 'next/server';

import { forbidden, sameOrigin, unavailable } from '@/lib/server/guard';
import { API_URL, isSiteRole, saveSession, type Session } from '@/lib/server/session';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(req.headers.get('x-forwarded-for') ? { 'x-forwarded-for': req.headers.get('x-forwarded-for')! } : {}) },
    body: JSON.stringify({ identifier: String(body.identifier ?? ''), password: String(body.password ?? '') }),
    cache: 'no-store',
  }).catch(() => null);
  if (!res) return unavailable();
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const s = data as Session;
  if (!isSiteRole(s.user.role)) {
    // Revoke the session we just received; this site is for partner companies and operations only.
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: s.refreshToken }),
    }).catch(() => {});
    return NextResponse.json(
      { error: { code: 'not_partner', message: 'This sign in is for partner companies. Use the My Captain app instead.' } },
      { status: 403 },
    );
  }
  await saveSession(s);
  return NextResponse.json({ user: s.user });
}
