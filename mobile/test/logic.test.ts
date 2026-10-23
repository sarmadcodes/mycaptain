import { describe, expect, it } from 'vitest';

import { durationText, isLive, isPast } from '@/features/booking/labels';
import { billableHours, durationLabel, quote } from '@/features/booking/pricing';
import type { BookingDraft } from '@/features/booking/store';
import { toInput } from '@/features/booking/to-input';
import { notificationTarget } from '@/features/notification-target';

const draft = (over: Partial<BookingDraft> = {}): BookingDraft => ({
  service: 'driver',
  vehicle: { class: 'suv', makeModel: 'Toyota Fortuner', engine: '', transmission: 'automatic', notes: '' },
  post: { address: '', point: '', instructions: '' },
  personnel: 1,
  start: 'now',
  date: '2026-11-02',
  time: '09:00',
  plan: 'hourly',
  hours: 4,
  days: 1,
  contractMonths: 6,
  location: ' DHA Phase 6, Karachi ',
  ...over,
});

describe('booking estimate', () => {
  it('matches the server for a 4-hour SUV driver (1000 x 4 + 5%)', () => {
    expect(quote(draft())).toMatchObject({ subtotal: 4000, fee: 200, total: 4200 });
  });

  it('counts 8-hour days and 26 working days a month', () => {
    expect(billableHours(draft({ plan: 'daily', days: 3 }))).toBe(24);
    expect(billableHours(draft({ plan: 'monthly' }))).toBe(208);
    expect(billableHours(draft({ plan: 'contract', contractMonths: 12 }))).toBe(12 * 208);
  });

  it('prices a security team as one armed lead plus the guards', () => {
    const team = quote(draft({ service: 'team', personnel: 2 }));
    expect(team.subtotal).toBe((1200 + 700 * 2) * 4);
  });

  it('shows a monthly figure for contracts', () => {
    const c = quote(draft({ plan: 'contract', contractMonths: 6 }));
    expect(c.perPeriod).toBe(Math.round(c.total / 6));
    expect(durationLabel(draft({ plan: 'contract', contractMonths: 12 }))).toBe('1 year contract');
  });
});

describe('booking request', () => {
  it('sends a driver booking with trimmed address and no empty fields', () => {
    const input = toInput(draft());
    expect(input).toMatchObject({ service: 'driver', asap: true, hours: 4, personnel: 1, location: { address: 'DHA Phase 6, Karachi' } });
    expect(input.vehicle).toEqual({ class: 'suv', makeModel: 'Toyota Fortuner', engine: undefined, transmission: 'automatic', notes: undefined });
    expect(input.startAt).toBeUndefined();
  });

  it('schedules long-term plans and sends the guard post, not a vehicle', () => {
    const input = toInput(
      draft({ service: 'guard', plan: 'monthly', personnel: 3, post: { address: ' Clifton Block 5 ', point: 'Main gate', instructions: ' Night shift ' } }),
    );
    expect(input.asap).toBe(false);
    expect(input.startAt).toBeTruthy();
    expect(input.vehicle).toBeUndefined();
    expect(input).toMatchObject({ personnel: 3, location: { address: 'Clifton Block 5', point: 'Main gate' }, instructions: 'Night shift' });
  });

  it('always sends one person for a single gunman', () => {
    expect(toInput(draft({ service: 'gunman', personnel: 4 })).personnel).toBe(1);
  });
});

describe('labels', () => {
  it('describes durations and booking states', () => {
    expect(durationText({ plan: 'hourly', hours: 1 })).toBe('1 hour');
    expect(durationText({ plan: 'daily', days: 2 })).toBe('2 days');
    expect(isLive('on_duty')).toBe(true);
    expect(isPast('cancelled')).toBe(true);
    expect(isLive('completed')).toBe(false);
  });
});

describe('notification taps', () => {
  const booking = { kind: 'booking', id: 'b1' };
  it('opens the right screen for each role', () => {
    expect(notificationTarget('customer', booking)).toBe('/booking/b1');
    expect(notificationTarget('guard', booking)).toBe('/assignment/b1');
    expect(notificationTarget('admin', booking)).toBe('/dispatch/b1');
    expect(notificationTarget('customer', { kind: 'case', id: 'c1' })).toBe('/case/c1');
    expect(notificationTarget('admin', { kind: 'case', id: 'c1' })).toBe('/cases/c1');
    expect(notificationTarget('admin', { kind: 'sos', id: 's1' })).toBe('/overview');
    expect(notificationTarget('customer', undefined)).toBeNull();
  });
});
