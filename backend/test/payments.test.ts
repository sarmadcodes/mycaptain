import { describe, expect, it } from 'vitest';

import { api, auth, customer } from './helpers';

const v1 = '/api/v1';
const input = {
  service: 'driver',
  plan: 'hourly',
  hours: 4,
  asap: true,
  vehicle: { class: 'sedan', transmission: 'automatic' },
  location: { address: 'DHA Phase 6, Karachi' },
};

describe('demo payments', () => {
  it('pays a booking once, moves it to assigning, and refunds on cancel', async () => {
    const c = await customer();
    const created = await api().post(`${v1}/bookings`).set(auth(c.token)).send(input).expect(201);
    const id = created.body.booking.id as string;

    const paid = await api().post(`${v1}/bookings/${id}/pay`).set(auth(c.token)).send({ method: 'wallet' }).expect(201);
    expect(paid.body.payment.reference).toMatch(/^DEMO-/);
    expect(paid.body.payment.amount).toBe(created.body.booking.price.total);
    expect(paid.body.booking.status).toBe('assigning');
    expect(paid.body.booking.paidAt).toBeTruthy();

    await api().post(`${v1}/bookings/${id}/pay`).set(auth(c.token)).send({ method: 'wallet' }).expect(409);

    // Someone else cannot pay or see it.
    const other = await customer('Other');
    await api().post(`${v1}/bookings/${id}/pay`).set(auth(other.token)).send({ method: 'card' }).expect(404);

    await api().post(`${v1}/bookings/${id}/status`).set(auth(c.token)).send({ to: 'cancelled', note: 'Plans changed' }).expect(200);
    const list = await api().get(`${v1}/me/payments`).set(auth(c.token)).expect(200);
    expect(list.body.items[0].status).toBe('refunded');
  });
});
