'use client';

import { ArrowLeftIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { use, useState } from 'react';

import { useCase, useUpdateCase } from '@/components/admin/hooks';
import { Badge, Button, Card, ErrorState, FormError, Skeleton } from '@/components/dash/ui';

const statusInfo = {
  open: { label: 'Open', tone: 'red' },
  in_progress: { label: 'In progress', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
} as const;
const time = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminCase({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useCase(id);
  const update = useUpdateCase(id);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');

  if (isLoading) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;
  const c = data.case;
  const input = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      <Link href="/admin/cases" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} /> Cases
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.ref}</h1>
        <Badge tone="blue">{c.type}</Badge>
        <Badge tone={statusInfo[c.status].tone}>{statusInfo[c.status].label}</Badge>
        {c.urgent ? <Badge tone="red">Urgent</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="whitespace-pre-line">{c.details}</p>
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
              <dt className="text-muted">Reported by</dt>
              <dd className="font-medium">
                {c.openedBy?.name ?? 'Unknown'} ({c.openedByRole}){c.openedBy?.phone ? `, ${c.openedBy.phone}` : ''}
              </dd>
              {c.booking ? (
                <>
                  <dt className="text-muted">Booking</dt>
                  <dd className="font-medium">
                    <Link href={`/admin/bookings/${c.booking.id}`} className="text-blue hover:underline">
                      {c.booking.code}
                    </Link>
                  </dd>
                  {c.booking.customer ? (
                    <>
                      <dt className="text-muted">Customer</dt>
                      <dd className="font-medium">{c.booking.customer.name}</dd>
                    </>
                  ) : null}
                  {c.booking.staff?.length ? (
                    <>
                      <dt className="text-muted">Staff</dt>
                      <dd className="font-medium">{c.booking.staff.map((s) => s.name).join(', ')}</dd>
                    </>
                  ) : null}
                </>
              ) : null}
              <dt className="text-muted">Opened</dt>
              <dd className="font-medium">{time(c.createdAt)}</dd>
            </dl>
            {c.resolution ? <p className="rounded-xl bg-surface px-4 py-3 text-sm">Resolution: {c.resolution}</p> : null}
          </Card>

          {c.evidence.length ? (
            <Card>
              <h2 className="mb-3 font-semibold">Evidence</h2>
              <div className="flex flex-wrap gap-3">
                {c.evidence.map((e) => (
                  <a key={e.id} href={e.url} target="_blank" rel="noreferrer noopener" className="block size-28 overflow-hidden rounded-xl bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed Cloudinary links */}
                    <img src={e.url} alt="Evidence" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <h2 className="mb-3 font-semibold">Timeline</h2>
            <ol className="space-y-3 text-sm">
              {c.timeline.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-28 shrink-0 text-faint">{time(t.at)}</span>
                  <span className={t.internal ? 'text-muted' : ''}>
                    {t.internal ? 'Internal note: ' : ''}
                    {t.text}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="font-semibold">Reply to reporter</h2>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} className={input} placeholder="They see this in the app" aria-label="Reply" />
            <Button className="w-full" disabled={reply.trim().length < 2} loading={update.isPending} onClick={() => update.mutate({ reply: reply.trim() }, { onSuccess: () => setReply('') })}>
              Send reply
            </Button>
          </Card>
          <Card className="space-y-3">
            <h2 className="font-semibold">Internal note</h2>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={input} placeholder="Operations only" aria-label="Internal note" />
            <Button variant="secondary" className="w-full" disabled={note.trim().length < 2} onClick={() => update.mutate({ note: note.trim() }, { onSuccess: () => setNote('') })}>
              Add note
            </Button>
          </Card>
          <Card className="space-y-3">
            <h2 className="font-semibold">Status</h2>
            {c.status === 'resolved' ? (
              <Button variant="secondary" className="w-full" onClick={() => update.mutate({ status: 'in_progress' })}>
                Reopen
              </Button>
            ) : (
              <>
                {c.status === 'open' ? (
                  <Button variant="secondary" className="w-full" onClick={() => update.mutate({ status: 'in_progress' })}>
                    Start handling
                  </Button>
                ) : null}
                <input value={resolution} onChange={(e) => setResolution(e.target.value)} className={`${input} h-12`} placeholder="Resolution the reporter will see" aria-label="Resolution" />
                <Button
                  className="w-full"
                  disabled={!resolution.trim() && !c.resolution}
                  onClick={() => update.mutate({ status: 'resolved', resolution: resolution.trim() || undefined }, { onSuccess: () => setResolution('') })}>
                  Mark resolved
                </Button>
              </>
            )}
          </Card>
          <FormError error={update.error} />
        </div>
      </div>
    </div>
  );
}
