import { NextResponse } from 'next/server';

import { forbidden, sameOrigin, unavailable } from '@/lib/server/guard';
import { API_URL } from '@/lib/server/session';

// Signed-out password reset, passed straight to the API. Never returns a session.
const TARGET: Record<string, string> = { forgot: 'password/forgot', reset: 'password/reset' };

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  if (!sameOrigin(req)) return forbidden();
  const target = TARGET[(await ctx.params).action];
  if (!target) return NextResponse.json({ error: { code: 'not_found', message: 'Not found.' } }, { status: 404 });
  const forwarded = req.headers.get('x-forwarded-for');
  const res = await fetch(`${API_URL}/auth/${target}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(forwarded ? { 'x-forwarded-for': forwarded } : {}) },
    body: await req.text(),
    cache: 'no-store',
  }).catch(() => null);
  if (!res) return unavailable();
  return NextResponse.json(await res.json(), { status: res.status });
}
