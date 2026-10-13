import dayjs from 'dayjs';

import type { BookingInput } from '@/features/api';

import type { BookingDraft } from './store';

// The booking being built in the app, as the request the API expects.
export function toInput(d: BookingDraft): BookingInput {
  const longTerm = d.plan === 'monthly' || d.plan === 'contract';
  const scheduled = d.start === 'later' || longTerm;
  const security = d.service === 'guard' || d.service === 'gunman' || d.service === 'team';
  return {
    service: d.service,
    plan: d.plan,
    asap: !scheduled,
    startAt: scheduled ? dayjs(`${d.date}T${d.time}`).toISOString() : undefined,
    hours: d.plan === 'hourly' ? d.hours : undefined,
    days: d.plan === 'daily' ? d.days : undefined,
    contractMonths: d.plan === 'contract' ? d.contractMonths : undefined,
    vehicle:
      d.service === 'driver'
        ? {
            class: d.vehicle.class,
            makeModel: d.vehicle.makeModel || undefined,
            engine: d.vehicle.engine || undefined,
            transmission: d.vehicle.transmission,
            notes: d.vehicle.notes || undefined,
          }
        : undefined,
    carId: d.service === 'rental' ? d.carId : undefined,
    personnel: d.service === 'gunman' || d.service === 'driver' || d.service === 'rental' ? 1 : d.personnel,
    location: security
      ? { address: d.post.address.trim(), point: d.post.point.trim() || undefined }
      : { address: d.location.trim() },
    instructions: (security ? d.post.instructions : d.vehicle.notes)?.trim() || undefined,
    requestedStaffId: d.staffId,
  };
}
