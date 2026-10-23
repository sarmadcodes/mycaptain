'use client';

import { BuildingsIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

import { useCompanies } from '@/components/admin/hooks';
import { Badge, Empty, ErrorState, PageHeader, Skeleton } from '@/components/dash/ui';
import type { CompanyStatus } from '@/lib/types';

const TABS: { key: CompanyStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'To review' },
  { key: 'changes_requested', label: 'Changes requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];
const tone = { pending: 'amber', changes_requested: 'amber', approved: 'green', rejected: 'red', suspended: 'red' } as const;
const label = { pending: 'In review', changes_requested: 'Changes requested', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended' };

export default function AdminPartners() {
  const [tab, setTab] = useState<CompanyStatus | 'all'>('pending');
  const { data, isLoading, error, refetch } = useCompanies(tab === 'all' ? undefined : tab);

  return (
    <div className="space-y-6">
      <PageHeader title="Partners" body="Review applications and documents, then approve, ask for changes or reject." />
      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-surface p-1 sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${t.key === tab ? 'bg-elevated shadow-sm' : 'text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Skeleton rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <Empty icon={BuildingsIcon} title="No companies here" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Services</th>
                <th className="px-5 py-3 font-medium">Documents</th>
                <th className="px-5 py-3 font-medium">Applied</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((c) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="px-5 py-3">
                    <Link href={`/admin/partners/${c.id}`} className="font-semibold text-blue hover:underline">
                      {c.tradingName || c.legalName}
                    </Link>
                    <span className="block text-xs text-faint">
                      {c.ref}, {c.city}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.services.join(', ')}</td>
                  <td className="px-5 py-3 text-muted">{c.documents.length} uploaded</td>
                  <td className="px-5 py-3 text-muted">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3">
                    <Badge tone={tone[c.status]}>{label[c.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
