import { describe, expect, it } from 'vitest';

import { api, approvedPartner, auth, customer, PNG } from './helpers';

const v1 = '/api/v1';

// A driver booking taken to the given status, with the people involved.
async function liveBooking(until: 'confirmed' | 'arriving' | 'on_duty' | 'completed') {
  const p = await approvedPartner();
  const c = await customer();
  const created = await api()
    .post(`${v1}/bookings`)
    .set(auth(c.token))
    .send({ service: 'driver', plan: 'hourly', hours: 4, asap: true, vehicle: { class: 'sedan', transmission: 'automatic' }, location: { address: 'DHA Phase 6, Karachi' } })
    .expect(201);
  const id = created.body.booking.id as string;
  await api().post(`${v1}/bookings/${id}/status`).set(auth(p.admin.token)).send({ to: 'paid' }).expect(200);
  await api().post(`${v1}/bookings/${id}/assign-company`).set(auth(p.admin.token)).send({ companyId: p.companyId }).expect(200);
  await api().post(`${v1}/bookings/${id}/assign-staff`).set(auth(p.partnerToken)).send({ staffIds: [p.driver.id] }).expect(200);
  for (const to of ['arriving', 'on_duty', 'completed'] as const) {
    if (until === 'confirmed') break;
    await api().post(`${v1}/bookings/${id}/status`).set(auth(p.driverToken)).send({ to }).expect(200);
    if (to === until) break;
  }
  return { p, c, id };
}

describe('chat', () => {
  it('lets the customer and assigned staff talk, and keeps others out', async () => {
    const { p, c, id } = await liveBooking('arriving');
    await api().post(`${v1}/bookings/${id}/messages`).set(auth(c.token)).send({ text: 'I am at the main gate' }).expect(201);
    await api().post(`${v1}/bookings/${id}/messages`).set(auth(p.driverToken)).send({ text: 'Two minutes away' }).expect(201);

    const list = await api().get(`${v1}/bookings/${id}/messages`).set(auth(c.token)).expect(200);
    expect(list.body.messages.map((m: { text: string }) => m.text)).toEqual(['I am at the main gate', 'Two minutes away']);
    expect(list.body.messages[1].from.name).toBeTruthy();

    const stranger = await customer('Someone Else');
    await api().get(`${v1}/bookings/${id}/messages`).set(auth(stranger.token)).expect(404);

    // The driver is told about the customer's message.
    const n = await api().get(`${v1}/me/notifications`).set(auth(p.driverToken)).expect(200);
    expect(n.body.items.some((x: { title: string }) => x.title.startsWith('Message from'))).toBe(true);
  });
});

describe('duty', () => {
  it('records breaks and check-ins only while on duty, and rejects a double break', async () => {
    const { p, id } = await liveBooking('on_duty');
    await api().post(`${v1}/bookings/${id}/events`).set(auth(p.driverToken)).send({ kind: 'check_in', lat: 24.8, lng: 67.06 }).expect(201);
    await api().post(`${v1}/bookings/${id}/events`).set(auth(p.driverToken)).send({ kind: 'break_start' }).expect(201);
    await api().post(`${v1}/bookings/${id}/events`).set(auth(p.driverToken)).send({ kind: 'break_start' }).expect(400);
    const end = await api().post(`${v1}/bookings/${id}/events`).set(auth(p.driverToken)).send({ kind: 'break_end' }).expect(201);
    expect(end.body.booking.events.map((e: { kind: string }) => e.kind)).toEqual(['check_in', 'break_start', 'break_end']);
  });

  it('keeps one latest location per staff member, only while live', async () => {
    const { p, c, id } = await liveBooking('arriving');
    await api().post(`${v1}/bookings/${id}/location`).set(auth(p.driverToken)).send({ lat: 24.8, lng: 67.0 }).expect(204);
    await api().post(`${v1}/bookings/${id}/location`).set(auth(p.driverToken)).send({ lat: 24.81, lng: 67.01, accuracy: 12 }).expect(204);
    const b = await api().get(`${v1}/bookings/${id}`).set(auth(c.token)).expect(200);
    expect(b.body.booking.locations).toHaveLength(1);
    expect(b.body.booking.locations[0]).toMatchObject({ lat: 24.81, lng: 67.01, accuracy: 12 });

    // Customers cannot post a location.
    await api().post(`${v1}/bookings/${id}/location`).set(auth(c.token)).send({ lat: 1, lng: 1 }).expect(403);
  });
});

describe('sos', () => {
  it('alerts admins and the partner, and tells the sender when help responds', async () => {
    const { p, c, id } = await liveBooking('on_duty');
    const raised = await api().post(`${v1}/sos`).set(auth(c.token)).send({ bookingId: id, lat: 24.8, lng: 67.0, note: 'Suspicious car outside' }).expect(201);

    const adminList = await api().get(`${v1}/sos?status=open`).set(auth(p.admin.token)).expect(200);
    expect(adminList.body.items).toHaveLength(1);
    const partnerList = await api().get(`${v1}/sos`).set(auth(p.partnerToken)).expect(200);
    expect(partnerList.body.items).toHaveLength(1);
    await api().get(`${v1}/sos`).set(auth(c.token)).expect(403);

    await api().post(`${v1}/sos/${raised.body.sos.id}/status`).set(auth(p.admin.token)).send({ status: 'acknowledged' }).expect(200);
    const n = await api().get(`${v1}/me/notifications`).set(auth(c.token)).expect(200);
    expect(n.body.items[0].title).toBe('Help is on the way');
  });
});

describe('ratings and earnings', () => {
  it('rates a completed booking once and counts it in staff earnings', async () => {
    const { p, c, id } = await liveBooking('completed');
    await api().post(`${v1}/bookings/${id}/rating`).set(auth(c.token)).send({ stars: 5, comment: 'Very professional' }).expect(200);
    await api().post(`${v1}/bookings/${id}/rating`).set(auth(c.token)).send({ stars: 1 }).expect(409);

    const e = await api().get(`${v1}/me/earnings?days=7`).set(auth(p.driverToken)).expect(200);
    expect(e.body.duties).toBe(1);
    expect(e.body.total).toBeGreaterThan(0);
    expect(e.body.rating).toBe(5);
  });

  it('refuses to rate an unfinished booking', async () => {
    const { c, id } = await liveBooking('confirmed');
    await api().post(`${v1}/bookings/${id}/rating`).set(auth(c.token)).send({ stars: 4 }).expect(400);
  });
});

describe('cases', () => {
  it('opens, adds evidence, hides internal notes from the customer, and resolves', async () => {
    const { p, c, id } = await liveBooking('completed');
    const opened = await api()
      .post(`${v1}/cases`)
      .set(auth(c.token))
      .send({ type: 'complaint', bookingId: id, details: 'Driver arrived 40 minutes late.' })
      .expect(201);
    const caseId = opened.body.case.id as string;
    expect(opened.body.case.ref).toMatch(/^MC-C-\d+$/);

    await api().post(`${v1}/cases/${caseId}/evidence`).set(auth(c.token)).attach('file', PNG, 'photo.png').expect(201);
    await api().patch(`${v1}/cases/${caseId}`).set(auth(p.admin.token)).send({ note: 'Checked GPS log, delay confirmed' }).expect(200);
    await api().patch(`${v1}/cases/${caseId}`).set(auth(p.admin.token)).send({ status: 'resolved' }).expect(400);
    await api()
      .patch(`${v1}/cases/${caseId}`)
      .set(auth(p.admin.token))
      .send({ status: 'resolved', resolution: 'PKR 500 credit applied' })
      .expect(200);

    const seen = await api().get(`${v1}/cases/${caseId}`).set(auth(c.token)).expect(200);
    expect(seen.body.case.status).toBe('resolved');
    expect(seen.body.case.evidence).toHaveLength(1);
    expect(seen.body.case.timeline.some((t: { text: string }) => t.text.includes('GPS'))).toBe(false);

    const adminView = await api().get(`${v1}/cases/${caseId}`).set(auth(p.admin.token)).expect(200);
    expect(adminView.body.case.timeline.some((t: { text: string }) => t.text.includes('GPS'))).toBe(true);

    // Others cannot read it.
    const other = await customer('Other Person');
    await api().get(`${v1}/cases/${caseId}`).set(auth(other.token)).expect(404);
  });
});

describe('notifications', () => {
  it('tells the customer their staff are on the way and marks all read', async () => {
    const { c } = await liveBooking('arriving');
    const n = await api().get(`${v1}/me/notifications`).set(auth(c.token)).expect(200);
    expect(n.body.items.map((x: { title: string }) => x.title)).toContain('Your staff are on the way');
    expect(n.body.unread).toBeGreaterThan(0);
    await api().post(`${v1}/me/notifications/read`).set(auth(c.token)).send({}).expect(204);
    const after = await api().get(`${v1}/me/notifications`).set(auth(c.token)).expect(200);
    expect(after.body.unread).toBe(0);
  });
});
