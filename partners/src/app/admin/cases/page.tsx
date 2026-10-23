'use client';

import { ChatCircleTextIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

import { useCases } from '@/components/admin/hooks';
import { Badge, Empty, ErrorState, PageHeader, Skeleton } from '@/components/dash/ui';

const caseStatus = {
  open: { label: 'Open', tone: 'red' },
  in_progress: { label: 'In progress', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
} as const;

export default function AdminCases() {
  const [resolved, setResolved] = useState(false);
  const { data, isLoading, error, refetch } = useCases();
  const items = (data?.items ?? []).filter((c) => (resolved ? c.status === 'resolved' : c.status !== 'resolved'));

  return (
    <div className="space-y-6">
      <PageHeader title="Cases" body="Accidents, complaints, incidents and replacement requests." />
      <div role="tablist" className="inline-flex rounded-xl bg-surface p-1">
        {[false, true].map((r) => (
          <button
            key={String(r)}
            role="tab"
            aria-selected={r === resolved}
            onClick={() => setResolved(r)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${r === resolved ? 'bg-elevated shadow-sm' : 'text-muted'}`}>
            {r ? 'Resolved' : 'Open'}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Skeleton rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !items.length ? (
        <Empty icon={ChatCircleTextIcon} title={resolved ? 'No resolved cases yet' : 'No open cases'} body="New reports appear here instantly." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((c) => (
            <Link key={c.id} href={`/admin/cases/${c.id}`} className="space-y-2 rounded-2xl border border-line bg-elevated p-5 transition hover:border-blue">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{c.type}</Badge>
                {c.urgent ? <Badge tone="red">Urgent</Badge> : null}
                <span className="ml-auto">
                  <Badge tone={caseStatus[c.status].tone}>{caseStatus[c.status].label}</Badge>
                </span>
              </div>
              <p className="font-semibold">
                {c.ref}
                {c.booking ? `, booking ${c.booking.code}` : ''}
              </p>
              <p className="line-clamp-2 text-sm text-muted">{c.details}</p>
              <p className="text-xs text-faint">
                Opened {new Date(c.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} by{' '}
                {c.openedBy?.name ?? c.openedByRole}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
