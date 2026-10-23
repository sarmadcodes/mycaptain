'use client';

// Browser calls go to this site's own /api routes; the server adds the partner's token.

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public fields?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path.startsWith('/api/') ? path : `/api/v1${path}`, {
      ...rest,
      headers: { ...(json !== undefined ? { 'content-type': 'application/json' } : {}), ...rest.headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('No connection. Check your internet and try again.', 'network', 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data?.error ?? {};
    if (res.status === 401 && typeof window !== 'undefined' && (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin'))) {
      window.location.href = '/sign-in';
    }
    throw new ApiError(e.message ?? 'Something went wrong. Please try again.', e.code ?? 'unknown', res.status, e.details?.fields);
  }
  return data as T;
}

export const upload = <T>(path: string, form: FormData) => api<T>(path, { method: 'POST', body: form });

export const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
