import { NextResponse } from 'next/server';

import { forbidden, sameOrigin, unavailable } from '@/lib/server/guard';
import { API_URL, saveSession, type Session } from '@/lib/server/session';

// Submits the partner application and signs the new partner in, so documents can be uploaded next.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const body = await req.text();
  const res = await fetch(`${API_URL}/companies/applications`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(req.headers.get('x-forwarded-for') ? { 'x-forwarded-for': req.headers.get('x-forwarded-for')! } : {}) },
    body,
    cache: 'no-store',
  }).catch(() => null);
  if (!res) return unavailable();
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  await saveSession(data as Session);
  return NextResponse.json({ company: data.company, user: data.user }, { status: 201 });
}
