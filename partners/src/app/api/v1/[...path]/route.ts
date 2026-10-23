import { NextResponse } from 'next/server';

import { canProxy } from '@/lib/server/access';
import { forbidden, sameOrigin, unavailable } from '@/lib/server/guard';
import { accessToken, API_URL, readSession, refreshSession, saveSession } from '@/lib/server/session';

async function forward(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!sameOrigin(req)) return forbidden();
  const path = (await ctx.params).path.join('/');
  const { role } = await readSession();
  if (!canProxy(role, path)) {
    return NextResponse.json({ error: { code: 'not_found', message: 'Not found.' } }, { status: 404 });
  }

  const url = `${API_URL}/${path}${new URL(req.url).search}`;
  // Body is read once and reused if the request is retried after a token refresh.
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();
  const contentType = req.headers.get('content-type');

  const send = (token: string | null) =>
    fetch(url, {
      method: req.method,
      headers: {
        ...(contentType ? { 'content-type': contentType } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...forwardedFor(req),
      },
      body,
      cache: 'no-store',
    }).catch(() => null);

  let res = await send(await accessToken());
  if (res?.status === 401) {
    const token = await refreshSession();
    if (token) res = await send(token);
  }
  if (!res) return unavailable();

  let text = await res.text();
  // Tokens never reach the browser: keep them in the httpOnly cookies and strip them from the body.
  if (text.includes('"refreshToken"')) {
    try {
      const { accessToken: a, refreshToken: r, ...rest } = JSON.parse(text);
      if (a && r) await saveSession({ accessToken: a, refreshToken: r });
      text = JSON.stringify(rest);
    } catch {}
  }
  return new NextResponse(text || null, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json', 'cache-control': 'no-store' },
  });
}

function forwardedFor(req: Request): Record<string, string> {
  const v = req.headers.get('x-forwarded-for');
  return v ? { 'x-forwarded-for': v } : {};
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT };
