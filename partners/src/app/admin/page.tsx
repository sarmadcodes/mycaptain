'use client';

import { SirenIcon } from '@phosphor-icons/react';
import Link from 'next/link';

import { useOverview, useSos, useSosStatus } from '@/components/admin/hooks';
import { bookingTitle, pkr, when } from '@/components/dash/format';
import { Badge, Button, Card, ErrorState, PageHeader, Skeleton, statusLabel, statusTone } from '@/components/dash/ui';

const ago = (iso: string) => {
  const m = Math.round((Date.now() - +new Date(iso)) / 60_000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export default function AdminOverview() {
  const { data, isLoading, error, refetch } = useOverview();
  const sos = useSos();
  const setSos = useSosStatus();
  const alerts = (sos.data?.items ?? []).filter((s) => s.status !== 'resolved');

  return (
    <div className="space-y-8">
      <PageHeader title="Operations" body="Live duties, assignments and partners. Updates arrive instantly." />

      {alerts.length ? (
        <section className="space-y-3" aria-label="Emergency alerts">
          {alerts.map((s) => (
            <div key={s.id} role="alert" className={`flex flex-col gap-3 rounded-2xl border border-danger p-4 sm:flex-row sm:items-center ${s.status === 'open' ? 'bg-danger/10' : ''}`}>
              <SirenIcon size={28} weight="fill" className="shrink-0 text-danger" />
              <div className="flex-1">
                <p className="font-semibold">
                  SOS from {s.raisedBy?.name ?? 'a user'} ({s.raisedBy?.role ?? 'user'}){s.booking ? `, ${s.booking.code}` : ''}
                </p>
                <p className="text-sm text-muted">
                  {s.booking?.location.address ? `${s.booking.location.address}. ` : ''}
                  {s.note ? `${s.note}. ` : ''}
                  {ago(s.createdAt)}, {s.status === 'open' ? 'not yet acknowledged' : 'acknowledged'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.raisedBy?.phone ? (
                  <a href={`tel:${s.raisedBy.phone}`} className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface">
                    Call {s.raisedBy.phone}
                  </a>
                ) : null}
                {s.lat != null && s.lng != null ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface">
                    Map
                  </a>
                ) : null}
                <Button
                  className="h-10"
                  variant={s.status === 'open' ? 'danger' : 'primary'}
                  loading={setSos.isPending && setSos.variables?.id === s.id}
                  onClick={() => setSos.mutate({ id: s.id, status: s.status === 'open' ? 'acknowledged' : 'resolved' })}>
                  {s.status === 'open' ? 'Acknowledge' : 'Resolve'}
                </Button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {isLoading ? (
        <Skeleton rows={3} />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'On duty', value: data.kpis.activeDuties, href: '/admin/bookings' },
              { label: 'On the way', value: data.kpis.arriving, href: '/admin/bookings' },
              { label: 'Need a partner or staff', value: data.kpis.awaitingAssignment, href: '/admin/bookings' },
              { label: 'Partners to review', value: data.kpis.pendingPartners, href: '/admin/partners' },
              { label: 'Paid today', value: pkr(data.kpis.paidToday), href: '/admin/bookings' },
            ].map((t) => (
              <Link key={t.label} href={t.href} className="rounded-2xl border border-line bg-elevated p-5 transition hover:border-blue">
                <p className="text-sm text-muted">{t.label}</p>
                <p className="mt-1 truncate text-2xl font-bold tracking-tight">{t.value}</p>
              </Link>
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Live bookings</h2>
            {data.live.length ? (
              <div className="overflow-hidden rounded-2xl border border-line">
                <ul className="divide-y divide-line">
                  {data.live.map((b) => (
                    <li key={b.id}>
                      <Link href={`/admin/bookings/${b.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-surface sm:flex-row sm:items-center sm:gap-6">
                        <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
                        <span className="text-xs text-faint sm:w-20">{b.code}</span>
                        <span className="flex-1 font-medium">{bookingTitle(b)}</span>
                        <span className="text-sm text-muted">{when(b.startAt)}</span>
                        <span className="text-sm text-muted sm:w-48 sm:text-right">{b.staff.map((s) => s.name).join(', ') || 'No staff yet'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Card>
                <p className="text-muted">No live bookings right now.</p>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
