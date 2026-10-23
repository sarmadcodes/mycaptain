'use client';

import { CalendarCheckIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

import { useAllBookings } from '@/components/admin/hooks';
import { bookingTitle, pkr, when } from '@/components/dash/format';
import { Badge, Empty, ErrorState, PageHeader, Skeleton, statusLabel, statusTone } from '@/components/dash/ui';
import type { BookingStatus } from '@/lib/types';

const TABS: { key: string; label: string; status?: BookingStatus[] }[] = [
  { key: 'action', label: 'Needs action', status: ['pending_payment', 'paid', 'assigning'] },
  { key: 'live', label: 'Confirmed and live', status: ['confirmed', 'arriving', 'on_duty'] },
  { key: 'done', label: 'Finished', status: ['completed', 'closed'] },
  { key: 'cancelled', label: 'Cancelled', status: ['cancelled'] },
  { key: 'all', label: 'All' },
];

export default function AdminBookings() {
  const [tab, setTab] = useState(TABS[0]!);
  const { data, isLoading, error, refetch } = useAllBookings(tab.status);

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" body="Assign paid bookings to a partner company and follow every duty." />
      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-surface p-1 sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === tab.key}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${t.key === tab.key ? 'bg-elevated shadow-sm' : 'text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Skeleton rows={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <Empty icon={CalendarCheckIcon} title="Nothing here" body="Bookings appear here as soon as customers make them." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Booking</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Starts</th>
                <th className="px-5 py-3 font-medium">Partner and staff</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((b) => (
                <tr key={b.id} className="hover:bg-surface">
                  <td className="px-5 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-blue hover:underline">
                      {b.code}
                    </Link>
                    <div className="mt-1">
                      <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                    </div>
                  </td>
                  <td className="px-5 py-3">{bookingTitle(b)}</td>
                  <td className="px-5 py-3 text-muted">{when(b.startAt)}</td>
                  <td className="px-5 py-3 text-muted">
                    {typeof b.company === 'object' && b.company ? b.company.tradingName || b.company.legalName : 'No partner yet'}
                    {b.staff.length ? <span className="block">{b.staff.map((s) => s.name).join(', ')}</span> : null}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{pkr(b.price.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
