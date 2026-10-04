import { create } from 'zustand';

import type { VehicleClass } from '@/lib/mock-data';
import type { ServiceType } from '@/types';
import { firstOpenTime, today } from '@/utils/datetime';

export type Plan = 'hourly' | 'daily' | 'monthly' | 'contract';

export type BookingDraft = {
  service: ServiceType;
  vehicle: { class: VehicleClass; makeModel: string; engine: string; transmission: 'automatic' | 'manual'; notes: string };
  post: { address: string; point: string; instructions: string };
  personnel: number;
  staffId?: string;
  // Rental car from the partner fleet (service 'rental').
  carId?: string;
  start: 'now' | 'later';
  // 'YYYY-MM-DD' and 'HH:mm', used when start is 'later'.
  date: string;
  time: string;
  plan: Plan;
  hours: number;
  days: number;
  contractMonths: 6 | 12;
  location: string;
};

const initial: BookingDraft = {
  service: 'driver',
  vehicle: { class: 'sedan', makeModel: '', engine: '1300', transmission: 'automatic', notes: '' },
  post: { address: '', point: '', instructions: '' },
  personnel: 1,
  start: 'now',
  date: today(),
  time: firstOpenTime(today()),
  plan: 'hourly',
  hours: 4,
  days: 1,
  contractMonths: 6,
  location: '',
};

type DraftStore = BookingDraft & {
  set: (patch: Partial<BookingDraft>) => void;
  reset: (service: ServiceType) => void;
};

// The booking being built across the booking screens.
export const useBookingDraft = create<DraftStore>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: (service) =>
    set({ ...initial, date: today(), time: firstOpenTime(today()), service, personnel: service === 'team' ? 3 : 1 }),
}));
