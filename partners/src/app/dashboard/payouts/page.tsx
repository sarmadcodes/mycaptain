'use client';

import { WalletIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

import { pkr } from '@/components/dash/format';
import { Badge, Card, Empty, ErrorState, PageHeader, Skeleton } from '@/components/dash/ui';
import { api } from '@/lib/api';

type Payout = {
  id: string;
  periodStart: string;
  periodEnd: string;
  count: number;
  amount: number;
  status: 'scheduled' | 'paid';
  reference?: string;
  paidAt?: string;
  bookings: { id: string; code: string; completedAt: string; price: { subtotal: number } }[];
};

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PayoutsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => api<{ items: Payout[]; pending: { count: number; amount: number } }>('/companies/me/payouts'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Payouts" body="Your share of every completed booking: the booking price less the My Captain service fee." />
      {isLoading ? (
        <Skeleton rows={3} />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <Card className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Completed, not yet on a statement</p>
              <p className="text-2xl font-bold tracking-tight">{pkr(data.pending.amount)}</p>
            </div>
            <p className="text-sm text-muted">
              {data.pending.count} booking{data.pending.count === 1 ? '' : 's'}. Statements are created weekly.
            </p>
          </Card>

          {!data.items.length ? (
            <Empty icon={WalletIcon} title="No statements yet" body="Each week's completed bookings appear here as a statement, then as paid once transferred." />
          ) : (
            <div className="space-y-3">
              {data.items.map((p) => (
                <details key={p.id} className="group rounded-2xl border border-line bg-elevated">
                  <summary className="flex cursor-pointer list-none flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {day(p.periodStart)} to {day(p.periodEnd)}
                      </p>
                      <p className="text-sm text-muted">
                        {p.count} booking{p.count === 1 ? '' : 's'}
                        {p.status === 'paid' && p.paidAt ? `, sent ${day(p.paidAt)}, ref ${p.reference}` : ''}
                      </p>
                    </div>
                    <Badge tone={p.status === 'paid' ? 'green' : 'blue'}>{p.status === 'paid' ? 'Paid' : 'Scheduled'}</Badge>
                    <p className="text-lg font-bold sm:w-36 sm:text-right">{pkr(p.amount)}</p>
                  </summary>
                  <ul className="divide-y divide-line border-t border-line px-5 text-sm">
                    {p.bookings.map((b) => (
                      <li key={b.id} className="flex justify-between py-2.5">
                        <span>
                          {b.code}, {day(b.completedAt)}
                        </span>
                        <span className="font-medium">{pkr(b.price.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
