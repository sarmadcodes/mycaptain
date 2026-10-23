import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { canProxy } from '@/lib/server/access';
import { sameOrigin } from '@/lib/server/guard';
import { proxy } from '@/proxy';

const id = '6ace3036391ff2d2e2c3e9f1';

describe('API allow-list', () => {
  it('lets partners reach only their own company and bookings', () => {
    expect(canProxy('partner', 'companies/me')).toBe(true);
    expect(canProxy('partner', 'companies/me/staff/123')).toBe(true);
    expect(canProxy('partner', `bookings/${id}/assign-staff`)).toBe(true);
    expect(canProxy('partner', `companies/${id}/review`)).toBe(false);
    expect(canProxy('partner', 'admin/overview')).toBe(false);
    expect(canProxy('partner', `bookings/${id}/status`)).toBe(false);
  });

  it('gives admins operations endpoints but not partner-only ones', () => {
    expect(canProxy('admin', 'admin/overview')).toBe(true);
    expect(canProxy('admin', `companies/${id}/review`)).toBe(true);
    expect(canProxy('admin', `bookings/${id}/assign-company`)).toBe(true);
    expect(canProxy('admin', `sos/${id}/status`)).toBe(true);
    expect(canProxy('admin', `admin/payouts/${id}/paid`)).toBe(true);
    expect(canProxy('admin', 'companies/me')).toBe(false);
    expect(canProxy('admin', 'auth/refresh')).toBe(false);
  });

  it('treats a missing role as a partner, never as an admin', () => {
    expect(canProxy(undefined, 'admin/overview')).toBe(false);
    expect(canProxy('customer', 'admin/overview')).toBe(false);
  });

  it('rejects path tricks', () => {
    expect(canProxy('partner', 'companies/me/../../admin/overview')).toBe(false);
    expect(canProxy('partner', 'companies/me/./staff')).toBe(false);
    expect(canProxy('partner', 'companies/me/%2e%2e/x')).toBe(false);
    expect(canProxy('partner', 'companies/me//staff')).toBe(false);
    expect(canProxy('partner', 'companies/me/a\\b')).toBe(false);
    expect(canProxy('admin', 'bookings/not-an-id/status')).toBe(false);
  });
});

describe('CSRF guard', () => {
  const req = (method: string, origin?: string) =>
    new Request('http://localhost:3010/api/v1/companies/me', { method, headers: { host: 'localhost:3010', ...(origin ? { origin } : {}) } });

  it('allows reads, and writes from this site only', () => {
    expect(sameOrigin(req('GET'))).toBe(true);
    expect(sameOrigin(req('POST', 'http://localhost:3010'))).toBe(true);
    expect(sameOrigin(req('POST', 'https://evil.example'))).toBe(false);
    expect(sameOrigin(req('POST'))).toBe(false);
  });
});

describe('page routing', () => {
  const visit = (path: string, cookies: Record<string, string> = {}) => {
    const r = new NextRequest(`http://localhost:3010${path}`, {
      headers: { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') },
    });
    const res = proxy(r);
    return res.headers.get('location');
  };

  it('sends signed-out visitors to sign in, keeping where they were going', () => {
    expect(visit('/dashboard/staff')).toBe('http://localhost:3010/sign-in?next=%2Fdashboard%2Fstaff');
    expect(visit('/admin')).toBe('http://localhost:3010/sign-in?next=%2Fadmin');
  });

  it('keeps each role in its own area', () => {
    expect(visit('/dashboard', { mcp_rt: 'x', mcp_role: 'admin' })).toBe('http://localhost:3010/admin');
    expect(visit('/admin/rates', { mcp_rt: 'x', mcp_role: 'partner' })).toBe('http://localhost:3010/dashboard');
    expect(visit('/admin', { mcp_rt: 'x', mcp_role: 'admin' })).toBeNull();
    expect(visit('/sign-in', { mcp_rt: 'x', mcp_role: 'partner' })).toBe('http://localhost:3010/dashboard');
  });
});
