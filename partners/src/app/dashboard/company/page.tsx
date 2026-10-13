'use client';

import { useState } from 'react';

import { useCompany } from '@/components/dash/hooks';
import { Badge, Button, Card, ErrorState, FormError, PageHeader, Skeleton } from '@/components/dash/ui';
import { Input } from '@/components/register/fields';
import { api } from '@/lib/api';

const statusText = { pending: 'In review', changes_requested: 'Changes requested', approved: 'Approved', rejected: 'Not approved', suspended: 'Suspended' };

export default function CompanyPage() {
  const { data, isLoading, error, refetch } = useCompany();
  if (isLoading) return <Skeleton rows={3} />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;
  const c = data.company;

  const rows: [string, string | undefined][] = [
    ['Reference', c.ref],
    ['Legal name', c.legalName],
    ['Trading name', c.tradingName],
    ['Head office', `${c.address}, ${c.city}`],
    ['Services', c.services.join(', ')],
    ['Cities', c.cities.join(', ')],
    ['Security licence', c.securityLicence ? `${c.securityLicence.number}, expires ${new Date(c.securityLicence.expiry).toLocaleDateString('en-GB')}` : undefined],
    ['Contact', `${c.contact.name}, ${c.contact.designation}`],
    ['Phone', c.contact.phone],
    ['Email', c.contact.email],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Company" body="To change registered details, email partners@mycaptain.pk." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">{c.tradingName || c.legalName}</h2>
            <Badge tone={c.status === 'approved' ? 'green' : c.status === 'pending' ? 'amber' : 'red'}>{statusText[c.status]}</Badge>
          </div>
          <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3 text-sm">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </Card>
        <ChangePassword />
      </div>
    </div>
  );
}

function ChangePassword() {
  const [v, setV] = useState({ current: '', next: '' });
  const [state, setState] = useState<{ busy?: boolean; error?: unknown; done?: boolean }>({});
  return (
    <Card>
      <h2 className="mb-5 font-semibold">Change password</h2>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setState({ busy: true });
          try {
            await api('/auth/password', { method: 'POST', json: v });
            setV({ current: '', next: '' });
            setState({ done: true });
          } catch (error) {
            setState({ error });
          }
        }}>
        <Input label="Current password" type="password" autoComplete="current-password" value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters. Other devices are signed out."
          value={v.next}
          onChange={(e) => setV({ ...v, next: e.target.value })}
        />
        <FormError error={state.error} />
        {state.done ? <p className="text-sm font-medium text-success">Password updated.</p> : null}
        <Button type="submit" className="w-full" loading={state.busy} disabled={!v.current || v.next.length < 8}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
