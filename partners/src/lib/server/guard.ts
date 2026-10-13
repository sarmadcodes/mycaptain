import 'server-only';

import { NextResponse } from 'next/server';

// Rejects state-changing requests that did not come from this site (CSRF defence on top of SameSite cookies).
export function sameOrigin(req: Request) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const forbidden = () =>
  NextResponse.json({ error: { code: 'forbidden', message: 'Request blocked.' } }, { status: 403 });

export const unavailable = () =>
  NextResponse.json({ error: { code: 'network', message: 'The service is unavailable. Try again shortly.' } }, { status: 503 });
