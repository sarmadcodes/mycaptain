import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { env } from '@/config/env';
import { sent } from '@/lib/email';

import { api, uniquePhone } from './helpers';

// Codes go to the email address instead of SMS for these tests.
beforeEach(() => {
  (env as { OTP_CHANNEL: string }).OTP_CHANNEL = 'email';
  sent.length = 0;
});
afterEach(() => {
  (env as { OTP_CHANNEL: string }).OTP_CHANNEL = 'sms';
});
const emailApp = async () => ({ api, sent });

describe('email codes', () => {
  it('signs up with the code emailed to the address given, and saves that address', async () => {
    const { api, sent } = await emailApp();
    const phone = uniquePhone();
    await api().post('/api/v1/auth/otp/request').send({ phone, purpose: 'sign-up' }).expect(400); // email required
    const r = await api().post('/api/v1/auth/otp/request').send({ phone, purpose: 'sign-up', email: 'Ayesha@Example.com' }).expect(200);
    expect(r.body).toMatchObject({ channel: 'email', sentTo: 'a*****@example.com' });
    expect(sent.at(-1)).toMatchObject({ to: 'ayesha@example.com' });

    // A different email on the verify call cannot replace the verified one.
    const v = await api()
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: r.body.devCode, name: 'Ayesha Khan', email: 'attacker@example.com' })
      .expect(201);
    expect(v.body.user.email).toBe('ayesha@example.com');
  });

  it('signs in by phone with the code sent to the email on the account', async () => {
    const { api, sent } = await emailApp();
    const phone = uniquePhone();
    const up = await api().post('/api/v1/auth/otp/request').send({ phone, purpose: 'sign-up', email: 'bilal@example.com' }).expect(200);
    await api().post('/api/v1/auth/otp/verify').send({ phone, code: up.body.devCode, name: 'Bilal' }).expect(201);

    await new Promise((r) => setTimeout(r, 0));
    // Resend cooldown is per phone; clear it for the test.
    const { kv } = await import('@/lib/kv');
    await kv.del(`otp:cd:+92${phone}`);
    const r = await api().post('/api/v1/auth/otp/request').send({ phone, purpose: 'sign-in' }).expect(200);
    expect(sent.at(-1)).toMatchObject({ to: 'bilal@example.com' });
    await api().post('/api/v1/auth/otp/verify').send({ phone, code: r.body.devCode }).expect(201);
  });

  it('refuses an email already used by another account', async () => {
    const { api } = await emailApp();
    const a = uniquePhone();
    const r = await api().post('/api/v1/auth/otp/request').send({ phone: a, purpose: 'sign-up', email: 'same@example.com' }).expect(200);
    await api().post('/api/v1/auth/otp/verify').send({ phone: a, code: r.body.devCode, name: 'First' }).expect(201);
    await api().post('/api/v1/auth/otp/request').send({ phone: uniquePhone(), purpose: 'sign-up', email: 'same@example.com' }).expect(409);
  });
});

describe('demo accounts', () => {
  it('sign in with the demo code only while DEMO_MODE is on, and are never emailed', async () => {
    const { UserModel } = await import('@/models/user');
    await UserModel.create({ role: 'customer', name: 'Demo Customer', phone: `+92${uniquePhone()}`, email: 'customer@gmail.com' });
    const e = env as { DEMO_MODE: boolean };

    e.DEMO_MODE = true;
    const r = await api().post('/api/v1/auth/otp/request').send({ email: 'customer@gmail.com', purpose: 'sign-in' }).expect(200);
    expect(r.body).toMatchObject({ demo: true });
    expect(r.body.phone).toBeUndefined(); // never reveal the number behind an email
    expect(sent).toHaveLength(0);
    await api().post('/api/v1/auth/otp/verify').send({ identifierEmail: 'customer@gmail.com', code: '000000' }).expect(400);
    await api().post('/api/v1/auth/otp/verify').send({ identifierEmail: 'customer@gmail.com', code: '123456' }).expect(201);

    e.DEMO_MODE = false;
    await api().post('/api/v1/auth/otp/verify').send({ identifierEmail: 'customer@gmail.com', code: '123456' }).expect(400);
  });

  it('refuses a verify with neither phone nor email', async () => {
    await api().post('/api/v1/auth/otp/verify').send({ code: '123456' }).expect(400);
  });
});
