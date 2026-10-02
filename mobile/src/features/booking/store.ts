import { create } from 'zustand';

import type { VehicleClass } from '@/lib/mock-data';
import type { ServiceType } from '@/types';

export type Plan = 'hourly' | 'daily' | 'monthly' | 'contract';

export type BookingDraft = {
  service: ServiceType;
  vehicle: { class: VehicleClass; makeModel: string; engine: string; transmission: 'automatic' | 'manual'; notes: string };
  post: { address: string; point: string; instructions: string };
  personnel: number;
  staffId?: string;
  start: 'now' | 'later';
  day: 'today' | 'tomorrow';
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
  day: 'today',
  time: '5:00 PM',
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
  reset: (service) => set({ ...initial, service, personnel: service === 'team' ? 3 : 1 }),
}));
