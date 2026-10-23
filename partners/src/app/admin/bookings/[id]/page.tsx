'use client';

import { ArrowLeftIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { use, useState } from 'react';

import { useAdminBooking, useBookingAction, useCompanies } from '@/components/admin/hooks';
import { bookingTitle, pkr, when } from '@/components/dash/format';
import { Badge, Button, Card, ErrorState, FormError, Skeleton, statusLabel, statusTone } from '@/components/dash/ui';
import type { Booking } from '@/lib/types';

// Which partner services can take each booking type.
const NEEDS: Record<Booking['service'], string> = { driver: 'drivers', rental: 'rentals', guard: 'guards', gunman: 'armed', team: 'teams' };

export default function AdminBooking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useAdminBooking(id);
  const companies = useCompanies('approved');
  const act = useBookingAction(id);
  const [companyId, setCompanyId] = useState('');
  const [reason, setReason] = useState('');

  if (isLoading) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;
  const b = data.booking;
  const company = typeof b.company === 'object' ? b.company : undefined;
  const customer = typeof b.customer === 'object' ? b.customer : undefined;
  const fit = (companies.data?.items ?? []).filter((c) => c.services.includes(NEEDS[b.service] as never));
  const canAssign = b.status === 'paid' || b.status === 'assigning';

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} /> Bookings
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{bookingTitle(b)}</h1>
        <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted">Booking</dt>
            <dd className="font-medium">{b.code}</dd>
            <dt className="text-muted">Customer</dt>
            <dd className="font-medium">{customer?.name ?? 'Customer'}</dd>
            <dt className="text-muted">Starts</dt>
            <dd className="font-medium">{when(b.startAt)}</dd>
            <dt className="text-muted">Location</dt>
            <dd className="font-medium">{b.location.point ? `${b.location.point}, ${b.location.address}` : b.location.address}</dd>
            {b.vehicle ? (
              <>
                <dt className="text-muted">Vehicle</dt>
                <dd className="font-medium">
                  {b.vehicle.makeModel ?? b.vehicle.class}, {b.vehicle.transmission}
                </dd>
              </>
            ) : null}
            <dt className="text-muted">Partner</dt>
            <dd className="font-medium">{company?.legalName ?? 'Not assigned'}</dd>
            <dt className="text-muted">Staff</dt>
            <dd className="font-medium">{b.staff.map((s) => s.name).join(', ') || 'None yet'}</dd>
            <dt className="text-muted">Total</dt>
            <dd className="font-medium">
              {pkr(b.price.total)} <span className="text-muted">(partner {pkr(b.price.subtotal)}, fee {pkr(b.price.fee)})</span>
            </dd>
          </dl>
          {b.instructions ? <p className="mt-5 border-t border-line pt-4 text-sm text-muted">{b.instructions}</p> : null}
        </Card>

        <div className="space-y-6">
          {canAssign ? (
            <Card className="space-y-4">
              <h2 className="font-semibold">{company ? 'Change partner' : 'Assign a partner'}</h2>
              {fit.length ? (
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm"
                  aria-label="Partner company">
                  <option value="">Choose an approved partner</option>
                  {fit.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradingName || c.legalName}, {c.cities.join(', ')}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted">No approved partner offers this service yet.</p>
              )}
              <Button className="w-full" disabled={!companyId} loading={act.isPending} onClick={() => act.mutate({ kind: 'company', companyId })}>
                Assign partner
              </Button>
            </Card>
          ) : null}

          {data.next.includes('paid') ? (
            <Card className="space-y-3">
              <h2 className="font-semibold">Payment</h2>
              <p className="text-sm text-muted">Mark paid only when a transfer is confirmed outside the app.</p>
              <Button variant="secondary" className="w-full" loading={act.isPending} onClick={() => act.mutate({ kind: 'status', to: 'paid' })}>
                Mark paid
              </Button>
            </Card>
          ) : null}

          {data.next.includes('cancelled') ? (
            <Card className="space-y-3">
              <h2 className="font-semibold">Cancel booking</h2>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason the customer will see"
                className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm"
                aria-label="Cancellation reason"
              />
              <Button variant="danger" className="w-full" disabled={reason.trim().length < 3} loading={act.isPending} onClick={() => act.mutate({ kind: 'status', to: 'cancelled', note: reason.trim() })}>
                Cancel and refund
              </Button>
            </Card>
          ) : null}
          <FormError error={act.error} />

          <Card>
            <h2 className="mb-3 font-semibold">History</h2>
            <ol className="space-y-2 text-sm">
              {b.history.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-28 shrink-0 text-faint">{new Date(h.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>
                    {statusLabel[h.status]}
                    {h.note ? <span className="text-muted">, {h.note}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
