import { NextResponse } from 'next/server';

import { forbidden, sameOrigin } from '@/lib/server/guard';
import { API_URL, clearSession, readSession } from '@/lib/server/session';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const { refresh } = await readSession();
  if (refresh) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => {});
  }
  await clearSession();
  return new NextResponse(null, { status: 204 });
}
