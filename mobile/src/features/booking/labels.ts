import dayjs from 'dayjs';

import type { ApiBooking, BookingStatus, Service } from '@/types/api';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';

export const statusInfo: Record<BookingStatus, { label: string; tone: Tone; customer: string }> = {
  pending_payment: { label: 'Awaiting payment', tone: 'amber', customer: 'We have your request and are confirming payment.' },
  paid: { label: 'Paid', tone: 'blue', customer: 'Payment received.' },
  assigning: { label: 'Assigning', tone: 'amber', customer: 'We are assigning your captain.' },
  confirmed: { label: 'Confirmed', tone: 'blue', customer: 'Your captain is confirmed.' },
  arriving: { label: 'Arriving', tone: 'blue', customer: 'Your captain is on the way.' },
  on_duty: { label: 'On duty', tone: 'green', customer: 'Your duty is live.' },
  completed: { label: 'Completed', tone: 'neutral', customer: 'Duty completed.' },
  closed: { label: 'Closed', tone: 'neutral', customer: 'Booking closed.' },
  cancelled: { label: 'Cancelled', tone: 'red', customer: 'This booking was cancelled.' },
};

export const serviceName: Record<Service, string> = {
  driver: 'Driver',
  rental: 'Car rental with driver',
  guard: 'Security guard (bouncer)',
  gunman: 'Armed gunman',
  team: 'Security team',
};

export function durationText(b: Pick<ApiBooking, 'plan' | 'hours' | 'days' | 'contractMonths'>) {
  switch (b.plan) {
    case 'hourly':
      return `${b.hours} ${b.hours === 1 ? 'hour' : 'hours'}`;
    case 'daily':
      return `${b.days} ${b.days === 1 ? 'day' : 'days'}`;
    case 'monthly':
      return '1 month';
    case 'contract':
      return b.contractMonths === 12 ? '1 year contract' : '6-month contract';
  }
}

export const bookingTitle = (b: ApiBooking) => `${serviceName[b.service]}, ${durationText(b)}`;

export function whenText(iso: string) {
  const d = dayjs(iso);
  const day = d.isSame(dayjs(), 'day') ? 'Today' : d.isSame(dayjs().add(1, 'day'), 'day') ? 'Tomorrow' : d.format('ddd D MMM');
  return `${day}, ${d.format('h:mm A')}`;
}

export const isLive = (s: BookingStatus) => ['assigning', 'confirmed', 'arriving', 'on_duty'].includes(s);
export const isUpcoming = (s: BookingStatus) => ['pending_payment', 'paid'].includes(s);
export const isPast = (s: BookingStatus) => ['completed', 'closed', 'cancelled'].includes(s);
