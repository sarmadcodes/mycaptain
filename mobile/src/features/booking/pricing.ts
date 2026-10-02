import type { VehicleClass } from '@/lib/mock-data';

import type { BookingDraft } from './store';

// Illustrative hourly rates in PKR. Real rates will come from admin rate cards.
const driverRate: Record<VehicleClass, number> = { small: 800, sedan: 900, suv: 1000, luxury: 1400 };
const securityRate = { guard: 700, gunman: 1200 };

export function billableHours(d: BookingDraft) {
  switch (d.plan) {
    case 'hourly':
      return d.hours;
    case 'daily':
      return d.days * 8;
    case 'monthly':
      return 26 * 8;
    case 'contract':
      return d.contractMonths * 26 * 8;
  }
}

const planDiscount = { hourly: 1, daily: 0.95, monthly: 0.85, contract: 0.8 };

export function hourlyRate(d: BookingDraft) {
  if (d.service === 'driver') return driverRate[d.vehicle.class];
  if (d.service === 'team') return securityRate.gunman + securityRate.guard * (d.personnel - 1);
  return securityRate[d.service] * d.personnel;
}

export function quote(d: BookingDraft) {
  const subtotal = Math.round(hourlyRate(d) * billableHours(d) * planDiscount[d.plan]);
  const fee = Math.round(subtotal * 0.05);
  return { subtotal, fee, total: subtotal + fee, perPeriod: d.plan === 'contract' ? Math.round((subtotal + fee) / d.contractMonths) : undefined };
}

export const formatPKR = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;

export function durationLabel(d: BookingDraft) {
  switch (d.plan) {
    case 'hourly':
      return `${d.hours} ${d.hours === 1 ? 'hour' : 'hours'}`;
    case 'daily':
      return `${d.days} ${d.days === 1 ? 'day' : 'days'}`;
    case 'monthly':
      return '1 month';
    case 'contract':
      return d.contractMonths === 12 ? '1 year contract' : `${d.contractMonths}-month contract`;
  }
}
