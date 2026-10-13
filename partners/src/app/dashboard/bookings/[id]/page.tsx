'use client';

import { ArrowLeftIcon, CheckCircleIcon, UserPlusIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { use, useMemo, useState } from 'react';

import { bookingTitle, pkr, staffNeed, when } from '@/components/dash/format';
import { useAssignStaff, useBooking, useStaff } from '@/components/dash/hooks';
import { Badge, Button, Card, Empty, ErrorState, FormError, Skeleton, statusLabel, statusTone } from '@/components/dash/ui';

const kindLabel = { driver: 'Driver', guard: 'Guard', gunman: 'Armed gunman' };

export default function BookingPage({ params }: PageProps<'/dashboard/bookings/[id]'>) {
  const { id } = use(params);
  const booking = useBooking(id);
  const staff = useStaff();
  const assign = useAssignStaff(id);
  const [picked, setPicked] = useState<string[] | null>(null);

  const b = booking.data?.booking;
  const need = useMemo(() => (b ? staffNeed(b) : []), [b]);
  const editable = b && (b.status === 'assigning' || b.status === 'confirmed');
  const current = picked ?? b?.staff.map((s) => s.id) ?? [];

  if (booking.isLoading) return <Skeleton rows={4} />;
  if (booking.error || !b) return <ErrorState error={booking.error} onRetry={booking.refetch} />;

  const pool = (staff.data?.staff ?? []).filter((s) => s.status === 'active' && need.some((n) => n.kind === s.staffKind));
  const countOf = (kind: string) => current.filter((id) => pool.find((s) => s.id === id)?.staffKind === kind).length;
  const complete = need.every((n) => countOf(n.kind) === n.count) && current.length === need.reduce((a, n) => a + n.count, 0);

  const toggle = (id: string, kind: 'driver' | 'guard' | 'gunman') => {
    const limit = need.find((n) => n.kind === kind)?.count ?? 0;
    setPicked((prev) => {
      const cur = prev ?? b.staff.map((s) => s.id);
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      // Single-person roles swap instead of refusing.
      if (limit === 1) return [...cur.filter((x) => pool.find((s) => s.id === x)?.staffKind !== kind), id];
      return countOf(kind) >= limit ? cur : [...cur, id];
    });
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} /> Bookings
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{bookingTitle(b)}</h1>
        <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted">Booking</dt>
            <dd className="font-medium">{b.code}</dd>
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
            {typeof b.car === 'object' && b.car ? (
              <>
                <dt className="text-muted">Car</dt>
                <dd className="font-medium">{b.car.name}</dd>
              </>
            ) : null}
            <dt className="text-muted">Customer</dt>
            <dd className="font-medium">{typeof b.customer === 'object' ? b.customer.name : 'Customer'}</dd>
            <dt className="text-muted">Service value</dt>
            <dd className="font-medium">{pkr(b.price.subtotal)}</dd>
          </dl>
          {b.instructions ? <p className="mt-5 border-t border-line pt-4 text-sm text-muted">{b.instructions}</p> : null}
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="font-semibold">{editable ? 'Assign staff' : 'Assigned staff'}</h2>
            <p className="text-sm text-muted">Needs {need.map((n) => `${n.count} ${kindLabel[n.kind].toLowerCase()}${n.count > 1 ? 's' : ''}`).join(' and ')}.</p>
          </div>

          {!editable ? (
            <ul className="space-y-2">
              {b.staff.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircleIcon size={18} weight="fill" className="text-success" /> {s.name}
                </li>
              ))}
            </ul>
          ) : staff.isLoading ? (
            <Skeleton rows={2} />
          ) : !pool.length ? (
            <Empty
              icon={UserPlusIcon}
              title="No matching staff"
              body="Add people with the right role on the Staff page first."
              action={
                <Link href="/dashboard/staff" className="text-sm font-semibold text-blue hover:underline">
                  Go to Staff
                </Link>
              }
            />
          ) : (
            <>
              {need.map((n) => (
                <fieldset key={n.kind} className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">
                    {kindLabel[n.kind]} ({countOf(n.kind)} of {n.count})
                  </legend>
                  {pool
                    .filter((s) => s.staffKind === n.kind)
                    .map((s) => {
                      const on = current.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${on ? 'border-blue bg-pale' : 'border-line hover:bg-surface'}`}>
                          <input type="checkbox" aria-label={s.name} checked={on} onChange={() => toggle(s.id, n.kind)} className="size-4 accent-[var(--blue)]" />
                          <span className="flex-1 font-medium">{s.name}</span>
                          <span className="text-xs text-faint">{s.phone}</span>
                        </label>
                      );
                    })}
                </fieldset>
              ))}
              <FormError error={assign.error} />
              <Button className="w-full" disabled={!complete || !picked} loading={assign.isPending} onClick={() => assign.mutate(current, { onSuccess: () => setPicked(null) })}>
                {b.status === 'assigning' ? 'Confirm and notify customer' : 'Save staff changes'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
