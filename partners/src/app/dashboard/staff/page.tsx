'use client';

import { FileArrowUpIcon, KeyIcon, PlusIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { useAddStaff, useCompany, useStaff, useUpdateStaff, useUploadStaffDoc } from '@/components/dash/hooks';
import { Badge, Button, Dialog, Empty, ErrorState, FormError, PageHeader, Skeleton } from '@/components/dash/ui';
import { Input, Select } from '@/components/register/fields';
import type { Staff } from '@/lib/types';

const kindLabel = { driver: 'Driver', guard: 'Guard (bouncer)', gunman: 'Armed gunman' };
const DOC_KINDS = [
  { value: 'cnic', label: 'CNIC' },
  { value: 'driving_licence', label: 'Driving licence' },
  { value: 'arms_licence', label: 'Arms licence' },
  { value: 'police_certificate', label: 'Police character certificate' },
  { value: 'medical', label: 'Medical fitness' },
  { value: 'training', label: 'Training certificate' },
];

export default function StaffPage() {
  const company = useCompany();
  const { data, isLoading, error, refetch } = useStaff();
  const update = useUpdateStaff();
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<Staff>();
  const [docsFor, setDocsFor] = useState<Staff>();
  const approved = company.data?.company.status === 'approved';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        body="Drivers and guards sign in to the My Captain app with the details you set here."
        action={
          <Button onClick={() => setAdding(true)} disabled={!approved} title={approved ? undefined : 'Available after approval'}>
            <PlusIcon size={18} weight="bold" /> Add staff
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.staff.length ? (
        <Empty
          icon={UsersThreeIcon}
          title="No staff yet"
          body={approved ? 'Add your drivers and guards so you can assign them to bookings.' : 'You can add staff once your company is approved.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Documents</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-faint">{s.phone}</p>
                  </td>
                  <td className="px-5 py-4">{kindLabel[s.staffKind]}</td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => setDocsFor(s)} className="font-medium text-blue hover:underline">
                      {s.documents.length} uploaded
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={s.status === 'active' ? 'green' : 'red'}>{s.status === 'active' ? 'Active' : 'Suspended'}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-9 px-3" onClick={() => setResetFor(s)} aria-label={`Reset password for ${s.name}`}>
                        <KeyIcon size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-9 px-3"
                        loading={update.isPending && update.variables?.id === s.id}
                        onClick={() => update.mutate({ id: s.id, status: s.status === 'active' ? 'suspended' : 'active' })}>
                        {s.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormError error={update.error} />

      <Dialog open={adding} onClose={() => setAdding(false)} title="Add staff">
        <AddStaff onDone={() => setAdding(false)} />
      </Dialog>
      <Dialog open={!!resetFor} onClose={() => setResetFor(undefined)} title={`New password for ${resetFor?.name ?? ''}`}>
        {resetFor ? <ResetPassword staff={resetFor} onDone={() => setResetFor(undefined)} /> : null}
      </Dialog>
      <Dialog open={!!docsFor} onClose={() => setDocsFor(undefined)} title={`Documents for ${docsFor?.name ?? ''}`}>
        {docsFor ? <StaffDocs staffId={docsFor.id} /> : null}
      </Dialog>
    </div>
  );
}

function AddStaff({ onDone }: { onDone: () => void }) {
  const add = useAddStaff();
  const [v, setV] = useState({ name: '', phone: '', staffKind: 'driver', password: '' });
  const [error, setError] = useState<string>();

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.name.trim().length < 2) return setError('Enter their full name.');
        if (!/^3\d{9}$/.test(v.phone)) return setError('Enter a mobile number like 3001234567.');
        if (v.password.length < 8) return setError('Use a password of at least 8 characters.');
        setError(undefined);
        add.mutate(v, { onSuccess: onDone });
      }}>
      <Input label="Full name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="off" />
      <Input
        label="Mobile number"
        prefix="+92"
        inputMode="numeric"
        maxLength={10}
        placeholder="3001234567"
        value={v.phone}
        onChange={(e) => setV({ ...v, phone: e.target.value.replace(/\D/g, '') })}
        hint="They sign in to the app with this number."
      />
      <Select
        label="Role"
        value={v.staffKind}
        onChange={(e) => setV({ ...v, staffKind: e.target.value })}
        options={[
          { value: 'driver', label: 'Driver' },
          { value: 'guard', label: 'Security guard (bouncer)' },
          { value: 'gunman', label: 'Armed gunman' },
        ]}
      />
      <Input
        label="Temporary password"
        type="text"
        value={v.password}
        onChange={(e) => setV({ ...v, password: e.target.value })}
        hint="Share it with them privately. At least 8 characters."
        autoComplete="new-password"
      />
      <FormError error={error ?? add.error} />
      <Button type="submit" className="w-full" loading={add.isPending}>
        Add staff member
      </Button>
    </form>
  );
}

function ResetPassword({ staff, onDone }: { staff: Staff; onDone: () => void }) {
  const update = useUpdateStaff();
  const [password, setPassword] = useState('');
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({ id: staff.id, password }, { onSuccess: onDone });
      }}>
      <p className="text-sm text-muted">They will be signed out on every device and need the new password to sign in.</p>
      <Input label="New password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters." autoComplete="new-password" />
      <FormError error={update.error} />
      <Button type="submit" className="w-full" disabled={password.length < 8} loading={update.isPending}>
        Set new password
      </Button>
    </form>
  );
}

function StaffDocs({ staffId }: { staffId: string }) {
  const { data } = useStaff();
  const staff = data?.staff.find((s) => s.id === staffId);
  const uploadDoc = useUploadStaffDoc();
  const [kind, setKind] = useState('cnic');

  return (
    <div className="space-y-5">
      <ul className="space-y-2">
        {staff?.documents.length ? (
          staff.documents.map((d) => (
            <li key={d.kind} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
              <span className="font-medium">{DOC_KINDS.find((k) => k.value === d.kind)?.label ?? d.kind}</span>
              <Badge tone={d.status === 'verified' ? 'green' : d.status === 'rejected' ? 'red' : 'amber'}>{d.status}</Badge>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted">No documents uploaded yet.</li>
        )}
      </ul>
      <div className="space-y-3 border-t border-line pt-5">
        <Select label="Document" value={kind} onChange={(e) => setKind(e.target.value)} options={DOC_KINDS} />
        <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-blue hover:border-blue">
          <FileArrowUpIcon size={18} />
          {uploadDoc.isPending ? 'Uploading...' : 'Choose file and upload'}
          <input
            type="file"
            accept=".pdf,image/*"
            className="sr-only"
            disabled={uploadDoc.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) uploadDoc.mutate({ id: staffId, kind, file });
            }}
          />
        </label>
        <FormError error={uploadDoc.error} />
      </div>
    </div>
  );
}
