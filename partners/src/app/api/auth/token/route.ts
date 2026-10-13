import { NextResponse } from 'next/server';

import { accessToken, refreshSession } from '@/lib/server/session';

// Short-lived access token for the live-updates socket. Same-origin only (cookie-bound).
export async function GET(req: Request) {
  const fresh = new URL(req.url).searchParams.get('fresh') === '1';
  const token = fresh ? await refreshSession() : await accessToken();
  if (!token) return NextResponse.json({ error: { code: 'unauthorized', message: 'Sign in again.' } }, { status: 401 });
  return NextResponse.json({ token }, { headers: { 'cache-control': 'no-store' } });
}
