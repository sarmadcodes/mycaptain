'use client';

import { ArrowLeftIcon, ArrowSquareOutIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { use, useState } from 'react';

import { useAdminCompany, useReview } from '@/components/admin/hooks';
import { Badge, Button, Card, ErrorState, FormError, Skeleton } from '@/components/dash/ui';

const DOC = { registration: 'Registration certificate', ntn: 'NTN certificate', security_licence: 'Security licence', other: 'Other document' } as Record<string, string>;
const label = { pending: 'In review', changes_requested: 'Changes requested', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended' };

export default function AdminPartner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useAdminCompany(id);
  const review = useReview(id);
  const [note, setNote] = useState('');

  if (isLoading) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;
  const c = data.company;
  const decide = (decision: 'approve' | 'request_changes' | 'reject' | 'suspend') =>
    review.mutate({ decision, note: note.trim() || undefined }, { onSuccess: () => setNote('') });

  const rows: [string, string | number | undefined][] = [
    ['Reference', c.ref],
    ['Legal name', c.legalName],
    ['Trading name', c.tradingName],
    ['Type', c.companyType],
    ['Registration no.', c.registrationNo],
    ['NTN', c.ntn],
    ['Established', c.yearEstablished],
    ['Head office', `${c.address}, ${c.city}`],
    ['Services', c.services.join(', ')],
    ['Cities', c.cities.join(', ')],
    ['Drivers / guards', `${c.driverCount ?? 0} / ${c.guardCount ?? 0}`],
    ['Security licence', c.securityLicence ? `${c.securityLicence.number}, expires ${new Date(c.securityLicence.expiry).toLocaleDateString('en-GB')}` : undefined],
    ['Contact', `${c.contact.name}, ${c.contact.designation}`],
    ['Phone', c.contact.phone],
    ['Email', c.contact.email],
    ['Staff on platform', data.staffCount],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/partners" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} /> Partners
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.tradingName || c.legalName}</h1>
        <Badge tone={c.status === 'approved' ? 'green' : c.status === 'pending' || c.status === 'changes_requested' ? 'amber' : 'red'}>{label[c.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-3 text-sm">
            {rows
              .filter(([, v]) => v !== undefined && v !== '')
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words font-medium">{v}</dd>
                </div>
              ))}
          </dl>
          {c.reviewNote ? <p className="mt-5 border-t border-line pt-4 text-sm text-muted">Last note: {c.reviewNote}</p> : null}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="font-semibold">Documents</h2>
            {c.documents.length ? (
              c.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{DOC[d.kind] ?? d.kind}</p>
                    <p className="text-xs text-faint">Uploaded {new Date(d.uploadedAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  {d.viewUrl ? (
                    <a href={d.viewUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-blue hover:underline">
                      Open <ArrowSquareOutIcon size={14} />
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No documents uploaded yet.</p>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Decision</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Note for the company (required unless approving)"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
              aria-label="Note for the company"
            />
            <FormError error={review.error} />
            <div className="grid grid-cols-2 gap-2">
              {c.status !== 'approved' ? (
                <Button loading={review.isPending && review.variables?.decision === 'approve'} onClick={() => decide('approve')}>
                  Approve
                </Button>
              ) : null}
              {c.status !== 'approved' && c.status !== 'rejected' ? (
                <Button variant="secondary" disabled={!note.trim()} onClick={() => decide('request_changes')}>
                  Ask for changes
                </Button>
              ) : null}
              {c.status !== 'rejected' && c.status !== 'approved' ? (
                <Button variant="danger" disabled={!note.trim()} onClick={() => decide('reject')}>
                  Reject
                </Button>
              ) : null}
              {c.status === 'approved' ? (
                <Button variant="danger" disabled={!note.trim()} onClick={() => decide('suspend')}>
                  Suspend
                </Button>
              ) : null}
              {c.status === 'suspended' ? <Button onClick={() => decide('approve')}>Reinstate</Button> : null}
            </div>
            <p className="text-xs text-faint">The company is emailed and notified. Suspending signs out all its staff.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
