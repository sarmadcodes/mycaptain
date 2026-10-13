'use client';

import { ArrowRightIcon, CalendarCheckIcon } from '@phosphor-icons/react';
import Link from 'next/link';

import { useBookings, useCompany, useStaff } from '@/components/dash/hooks';
import { bookingTitle, pkr, when } from '@/components/dash/format';
import { Badge, Card, Empty, ErrorState, PageHeader, Skeleton, statusLabel, statusTone } from '@/components/dash/ui';

export default function OverviewPage() {
  const company = useCompany();
  const staff = useStaff();
  const active = useBookings(['assigning', 'confirmed', 'arriving', 'on_duty']);
  const done = useBookings(['completed', 'closed']);

  if (company.isLoading) return <Skeleton rows={4} />;
  if (company.error) return <ErrorState error={company.error} onRetry={company.refetch} />;

  const items = active.data?.items ?? [];
  const needStaff = items.filter((b) => b.status === 'assigning');
  const onDuty = items.filter((b) => b.status === 'on_duty').length;
  const activeStaff = (staff.data?.staff ?? []).filter((s) => s.status === 'active').length;
  const earned = (done.data?.items ?? []).reduce((sum, b) => sum + b.price.subtotal, 0);

  const tiles = [
    { label: 'Need staff', value: String(needStaff.length), href: '/dashboard/bookings' },
    { label: 'On duty now', value: String(onDuty), href: '/dashboard/bookings' },
    { label: 'Active staff', value: String(activeStaff), href: '/dashboard/staff' },
    { label: 'Completed work value', value: pkr(earned), href: '/dashboard/bookings' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${company.data?.company.contact.name.split(' ')[0] ?? ''}`} body="Bookings assigned to your company update here live." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="rounded-2xl border border-line bg-elevated p-5 transition hover:border-blue">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 truncate text-2xl font-bold tracking-tight">{t.value}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Needs your staff</h2>
          <Link href="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:underline">
            All bookings <ArrowRightIcon size={14} />
          </Link>
        </div>
        {active.isLoading ? (
          <Skeleton rows={2} />
        ) : active.error ? (
          <ErrorState error={active.error} onRetry={active.refetch} />
        ) : needStaff.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {needStaff.map((b) => (
              <Link key={b.id} href={`/dashboard/bookings/${b.id}`}>
                <Card className="space-y-2 transition hover:border-blue">
                  <div className="flex items-center justify-between">
                    <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                    <span className="text-xs text-faint">{b.code}</span>
                  </div>
                  <p className="font-semibold">{bookingTitle(b)}</p>
                  <p className="text-sm text-muted">
                    {when(b.startAt)}, {b.location.address}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Empty icon={CalendarCheckIcon} title="Nothing waiting" body="When My Captain assigns a booking to your company it appears here instantly." />
        )}
      </section>
    </div>
  );
}
