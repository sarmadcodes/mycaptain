'use client';

import { useState } from 'react';

import { usePayoutActions, usePayoutPreview, usePayouts } from '@/components/admin/hooks';
import { pkr } from '@/components/dash/format';
import { Badge, Button, Card, ErrorState, FormError, PageHeader, Skeleton } from '@/components/dash/ui';

const dayInput = (d: Date) => d.toISOString().slice(0, 10);
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminPayouts() {
  const today = new Date();
  const [from, setFrom] = useState(dayInput(new Date(today.getTime() - 7 * 86_400_000)));
  const [to, setTo] = useState(dayInput(today));
  // Dates are whole days in Pakistan time.
  const range = { from: `${from}T00:00:00+05:00`, to: `${to}T00:00:00+05:00` };
  const preview = usePayoutPreview(range.from, range.to);
  const list = usePayouts();
  const { generate, paid } = usePayoutActions();
  const [refs, setRefs] = useState<Record<string, string>>({});
  const input = 'h-11 rounded-xl border border-line bg-surface px-3 text-sm';

  return (
    <div className="space-y-6">
      <PageHeader title="Payouts" body="Statements for partner companies. Created automatically every Monday; you can also create them here." />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="block text-muted">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block text-muted">To (not included)</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
          </label>
          <Button disabled={!preview.data?.items.length} loading={generate.isPending} onClick={() => generate.mutate(range)}>
            Create statements
          </Button>
        </div>
        {preview.isLoading ? (
          <Skeleton rows={1} />
        ) : preview.data?.items.length ? (
          <ul className="divide-y divide-line text-sm">
            {preview.data.items.map((p) => (
              <li key={p.company.id} className="flex justify-between py-2">
                <span>
                  {p.company.name ?? 'Company'}, {p.count} bookings <span className="text-muted">(fees {pkr(p.fees)})</span>
                </span>
                <span className="font-semibold">{pkr(p.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No completed bookings waiting for a statement in these dates.</p>
        )}
        <FormError error={generate.error ?? preview.error} />
      </Card>

      {list.isLoading ? (
        <Skeleton rows={3} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(list.data?.items ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium">{p.company.tradingName || p.company.legalName}</td>
                  <td className="px-5 py-3 text-muted">
                    {day(p.periodStart)} to {day(p.periodEnd)}, {p.count} bookings
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{pkr(p.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={p.status === 'paid' ? 'green' : 'blue'}>{p.status === 'paid' ? 'Paid' : 'Scheduled'}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {p.status === 'paid' ? (
                      <span className="text-muted">
                        {p.reference}, {day(p.paidAt!)}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={refs[p.id] ?? ''}
                          onChange={(e) => setRefs((r) => ({ ...r, [p.id]: e.target.value }))}
                          placeholder="Bank reference"
                          className={`${input} w-40`}
                          aria-label="Bank reference"
                        />
                        <Button
                          variant="secondary"
                          className="h-11"
                          disabled={(refs[p.id] ?? '').trim().length < 3}
                          loading={paid.isPending && paid.variables?.id === p.id}
                          onClick={() => paid.mutate({ id: p.id, reference: refs[p.id]!.trim() })}>
                          Mark paid
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormError error={paid.error} />
    </div>
  );
}
