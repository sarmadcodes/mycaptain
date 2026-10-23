import { describe, expect, it } from 'vitest';

import { api, approvedPartner, auth, customer } from './helpers';

const v1 = '/api/v1';

describe('partner payouts', () => {
  it('bills each completed booking once and lets the partner follow the statement', async () => {
    const p = await approvedPartner();
    const c = await customer();
    const created = await api()
      .post(`${v1}/bookings`)
      .set(auth(c.token))
      .send({ service: 'driver', plan: 'hourly', hours: 4, asap: true, vehicle: { class: 'sedan', transmission: 'automatic' }, location: { address: 'Clifton, Karachi' } })
      .expect(201);
    const id = created.body.booking.id as string;
    await api().post(`${v1}/bookings/${id}/pay`).set(auth(c.token)).send({ method: 'card' }).expect(201);
    await api().post(`${v1}/bookings/${id}/assign-company`).set(auth(p.admin.token)).send({ companyId: p.companyId }).expect(200);
    await api().post(`${v1}/bookings/${id}/assign-staff`).set(auth(p.partnerToken)).send({ staffIds: [p.driver.id] }).expect(200);
    for (const to of ['arriving', 'on_duty', 'completed']) {
      await api().post(`${v1}/bookings/${id}/status`).set(auth(p.driverToken)).send({ to }).expect(200);
    }

    const before = await api().get(`${v1}/companies/me/payouts`).set(auth(p.partnerToken)).expect(200);
    expect(before.body.pending).toEqual({ count: 1, amount: created.body.booking.price.subtotal });

    const from = new Date(Date.now() - 86_400_000).toISOString();
    const to = new Date(Date.now() + 60_000).toISOString();
    const preview = await api().get(`${v1}/admin/payouts/preview?from=${from}&to=${to}`).set(auth(p.admin.token)).expect(200);
    expect(preview.body.items[0]).toMatchObject({ count: 1, amount: created.body.booking.price.subtotal });

    await api().post(`${v1}/admin/payouts/generate`).set(auth(p.admin.token)).send({ from, to }).expect(201);
    // Running it again creates nothing: the booking is already on a statement.
    const again = await api().post(`${v1}/admin/payouts/generate`).set(auth(p.admin.token)).send({ from, to }).expect(201);
    expect(again.body.created).toBe(0);

    const list = await api().get(`${v1}/admin/payouts`).set(auth(p.admin.token)).expect(200);
    const payoutId = list.body.items[0].id as string;
    await api().post(`${v1}/admin/payouts/${payoutId}/paid`).set(auth(p.admin.token)).send({ reference: 'IBFT-778812' }).expect(200);

    const mine = await api().get(`${v1}/companies/me/payouts`).set(auth(p.partnerToken)).expect(200);
    expect(mine.body.items[0]).toMatchObject({ status: 'paid', reference: 'IBFT-778812', count: 1 });
    expect(mine.body.pending.count).toBe(0);

    // Partners cannot see the admin list.
    await api().get(`${v1}/admin/payouts`).set(auth(p.partnerToken)).expect(403);
  });
});
