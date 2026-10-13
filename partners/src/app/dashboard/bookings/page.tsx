'use client';

import { CalendarCheckIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

import { bookingTitle, pkr, when } from '@/components/dash/format';
import { useBookings } from '@/components/dash/hooks';
import { Badge, Empty, ErrorState, PageHeader, Skeleton, statusLabel, statusTone } from '@/components/dash/ui';
import type { BookingStatus } from '@/lib/types';

const TABS: { key: string; label: string; status: BookingStatus[] }[] = [
  { key: 'staff', label: 'Need staff', status: ['assigning'] },
  { key: 'active', label: 'Upcoming and live', status: ['confirmed', 'arriving', 'on_duty'] },
  { key: 'past', label: 'Past', status: ['completed', 'closed', 'cancelled'] },
];

export default function BookingsPage() {
  const [tab, setTab] = useState(TABS[0]!);
  const { data, isLoading, error, refetch } = useBookings(tab.status);

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" body="Assigned to your company by My Captain" />
      <div role="tablist" className="inline-flex rounded-xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === tab.key}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition sm:px-4 ${t.key === tab.key ? 'bg-elevated shadow-sm' : 'text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <Empty icon={CalendarCheckIcon} title="No bookings here" body="Bookings appear here live as soon as they are assigned." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <ul className="divide-y divide-line">
            {data.items.map((b) => (
              <li key={b.id}>
                <Link href={`/dashboard/bookings/${b.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-surface sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                      <span className="text-xs text-faint">{b.code}</span>
                    </div>
                    <p className="font-semibold">{bookingTitle(b)}</p>
                    <p className="truncate text-sm text-muted">
                      {when(b.startAt)}, {b.location.address}
                    </p>
                  </div>
                  <div className="text-sm text-muted sm:w-48 sm:text-right">
                    {b.staff.length ? b.staff.map((s) => s.name).join(', ') : 'No staff yet'}
                  </div>
                  <div className="font-semibold sm:w-32 sm:text-right">{pkr(b.price.subtotal)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
