import { describe, expect, it } from 'vitest';

import { cancelUnpaid, remindUpcoming, warnExpiring } from '@/lib/jobs';
import { BookingModel } from '@/models/booking';
import { CompanyModel } from '@/models/company';
import { NotificationModel } from '@/models/ops';

import { api, approvedPartner, auth, customer } from './helpers';

const v1 = '/api/v1';
const driverBooking = (startAt?: string) => ({
  service: 'driver',
  plan: 'hourly',
  hours: 4,
  ...(startAt ? { asap: false, startAt } : { asap: true }),
  vehicle: { class: 'sedan', transmission: 'automatic' },
  location: { address: 'Gulberg, Lahore' },
});
const titles = async (user: string) => (await NotificationModel.find({ user }).lean()).map((n) => n.title);

describe('background jobs', () => {
  it('cancels bookings left unpaid and tells the customer', async () => {
    const c = await customer();
    const b = (await api().post(`${v1}/bookings`).set(auth(c.token)).send(driverBooking()).expect(201)).body.booking;
    expect(await cancelUnpaid(new Date())).toBe(0); // still within the payment window
    expect(await cancelUnpaid(new Date(Date.now() + 31 * 60_000))).toBe(1);
    const after = await BookingModel.findById(b.id).lean();
    expect(after).toMatchObject({ status: 'cancelled', cancelReason: 'Not paid in time' });
    expect(await titles(c.user.id)).toContain(`Booking ${b.code} cancelled`);
  });

  it('reminds staff and customer an hour before a confirmed duty, once', async () => {
    const p = await approvedPartner();
    const c = await customer();
    const start = new Date(Date.now() + 3 * 3600_000).toISOString();
    const b = (await api().post(`${v1}/bookings`).set(auth(c.token)).send(driverBooking(start)).expect(201)).body.booking;
    await api().post(`${v1}/bookings/${b.id}/pay`).set(auth(c.token)).send({ method: 'card' }).expect(201);
    await api().post(`${v1}/bookings/${b.id}/assign-company`).set(auth(p.admin.token)).send({ companyId: p.companyId }).expect(200);
    await api().post(`${v1}/bookings/${b.id}/assign-staff`).set(auth(p.partnerToken)).send({ staffIds: [p.driver.id] }).expect(200);

    expect(await remindUpcoming(new Date())).toBe(0); // three hours away
    const hourBefore = new Date(Date.parse(start) - 50 * 60_000);
    expect(await remindUpcoming(hourBefore)).toBe(1);
    expect(await remindUpcoming(hourBefore)).toBe(0);
    expect((await titles(p.driver.id)).some((t) => t.startsWith(`Duty ${b.code} starts`))).toBe(true);
  });

  it('warns the company 7 days before its security licence expires', async () => {
    const p = await approvedPartner();
    await CompanyModel.updateOne({ _id: p.companyId }, { $set: { 'securityLicence.expiry': new Date(Date.now() + 6.5 * 86_400_000) } });
    expect(await warnExpiring(new Date())).toBe(1);
    const owner = (await api().get(`${v1}/auth/me`).set(auth(p.partnerToken))).body.user.id as string;
    expect(await titles(owner)).toContain('Security licence expires in 7 days');
  });
});
