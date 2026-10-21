import request from 'supertest';
import { expect } from 'vitest';

import { createApp } from '@/app';
import { UserModel, type Role } from '@/models/user';

export const app = createApp();
export const api = () => request(app);

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

let n = 0;
export const uniquePhone = () => `3${String(100000000 + ++n).padStart(9, '0')}`;

// Customer via the real OTP flow (dev code is returned outside production).
export async function customer(name = 'Aziz Mughal') {
  const phone = uniquePhone();
  const r1 = await api().post('/api/v1/auth/otp/request').send({ phone, purpose: 'sign-up' }).expect(200);
  const r2 = await api().post('/api/v1/auth/otp/verify').send({ phone, code: r1.body.devCode, name }).expect(201);
  return { token: r2.body.accessToken as string, refresh: r2.body.refreshToken as string, user: r2.body.user, phone };
}

// Password user created directly (admins are seeded, not self-registered).
export async function passwordUser(role: Role, extra: Record<string, unknown> = {}) {
  const phone = uniquePhone();
  const u = new UserModel({ role, name: `${role} user`, phone, ...extra });
  await u.setPassword('correct-horse-battery');
  await u.save();
  const r = await api().post('/api/v1/auth/login').send({ identifier: phone, password: 'correct-horse-battery' }).expect(200);
  return { token: r.body.accessToken as string, user: r.body.user, phone };
}

export const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

export const application = (overrides: Record<string, unknown> = {}) => ({
  legalName: 'Shield Force Security (Pvt) Ltd',
  companyType: 'private-limited',
  registrationNo: '0123456',
  ntn: `${1000000 + ++n}-8`,
  yearEstablished: 2014,
  city: 'Karachi',
  address: 'Office 12, Shahrah-e-Faisal, Karachi',
  services: ['drivers', 'guards', 'armed', 'teams', 'rentals'],
  cities: ['Karachi'],
  driverCount: 20,
  guardCount: 85,
  securityLicence: { number: 'PSRA-KHI-0412', expiry: '2030-06-30' },
  contact: { name: 'Tariq Hussain', designation: 'Director', phone: uniquePhone(), email: `owner${n}@shieldforce.pk` },
  password: 'partner-password-123',
  ...overrides,
});

export const inTwoHours = () => new Date(Date.now() + 2 * 3600_000).toISOString();

// Approved partner with one driver, two guards and one gunman.
export async function approvedPartner() {
  const admin = await passwordUser('admin');
  const applied = await api().post(`/api/v1/companies/applications`).send(application()).expect(201);
  const partnerToken = applied.body.accessToken as string;
  const companyId = applied.body.company.id as string;

  // Approval needs the documents.
  const early = await api().post(`/api/v1/companies/${companyId}/review`).set(auth(admin.token)).send({ decision: 'approve' }).expect(400);
  expect(early.body.error.details.missing).toContain('registration');

  for (const kind of ['registration', 'ntn', 'security_licence']) {
    await api().post(`/api/v1/companies/me/documents`).set(auth(partnerToken)).field('kind', kind).attach('file', PNG, 'doc.png').expect(201);
  }
  const approved = await api().post(`/api/v1/companies/${companyId}/review`).set(auth(admin.token)).send({ decision: 'approve' }).expect(200);
  expect(approved.body.company.status).toBe('approved');

  const mk = async (staffKind: string, phone: string) =>
    (
      await api()
        .post(`/api/v1/companies/me/staff`)
        .set(auth(partnerToken))
        .send({ name: `${staffKind} ${phone.slice(-3)}`, phone, staffKind, password: 'staff-password-1' })
        .expect(201)
    ).body.staff;
  const driver = await mk('driver', '3451110001');
  const guard1 = await mk('guard', '3451110002');
  const guard2 = await mk('guard', '3451110003');
  const gunman = await mk('gunman', '3451110004');

  const login = async (phone: string) =>
    (await api().post(`/api/v1/auth/login`).send({ identifier: phone, password: 'staff-password-1' }).expect(200)).body.accessToken as string;

  return { admin, partnerToken, companyId, driver, guard1, guard2, gunman, driverToken: await login('3451110001'), login };
}

