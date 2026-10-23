import type { Href } from 'expo-router';

import type { Role } from '@/types/api';

// Where a tapped notification should open, per role.
export function notificationTarget(role: Role, link?: { kind: string; id: string }): Href | null {
  if (!link) return null;
  if (link.kind === 'booking') {
    if (role === 'customer') return `/booking/${link.id}` as Href;
    if (role === 'driver' || role === 'guard') return `/assignment/${link.id}` as Href;
    if (role === 'admin') return `/dispatch/${link.id}` as Href;
  }
  if (link.kind === 'case') return (role === 'admin' ? `/cases/${link.id}` : `/case/${link.id}`) as Href;
  if (link.kind === 'sos' && role === 'admin') return '/overview' as Href;
  return null;
}
