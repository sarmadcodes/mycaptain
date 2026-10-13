import type { Booking } from '@/lib/types';

export const pkr = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;

const SERVICE: Record<Booking['service'], string> = {
  driver: 'Driver',
  rental: 'Car rental with driver',
  guard: 'Security guard (bouncer)',
  gunman: 'Armed gunman',
  team: 'Security team',
};

export function bookingTitle(b: Booking) {
  const d =
    b.plan === 'hourly'
      ? `${b.hours} h`
      : b.plan === 'daily'
        ? `${b.days} ${b.days === 1 ? 'day' : 'days'}`
        : b.plan === 'monthly'
          ? '1 month'
          : `${b.contractMonths}-month contract`;
  return `${SERVICE[b.service]}, ${d}`;
}

export function when(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const day =
    d.toDateString() === today.toDateString()
      ? 'Today'
      : d.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

// How many people of which kind a booking needs.
export function staffNeed(b: Booking): { kind: 'driver' | 'guard' | 'gunman'; count: number }[] {
  switch (b.service) {
    case 'driver':
    case 'rental':
      return [{ kind: 'driver', count: 1 }];
    case 'gunman':
      return [{ kind: 'gunman', count: 1 }];
    case 'guard':
      return [{ kind: 'guard', count: b.personnel }];
    case 'team':
      return [
        { kind: 'gunman', count: 1 },
        { kind: 'guard', count: b.personnel },
      ];
  }
}
