'use client';

import { ArrowSquareOutIcon, FileArrowUpIcon } from '@phosphor-icons/react';

import { useCompany, useUploadCompanyDoc } from '@/components/dash/hooks';
import { Badge, Card, ErrorState, FormError, PageHeader, Skeleton } from '@/components/dash/ui';

const KINDS = [
  { kind: 'registration', label: 'Registration certificate', required: true },
  { kind: 'ntn', label: 'NTN certificate', required: true },
  { kind: 'security_licence', label: 'Security licence', securityOnly: true },
  { kind: 'other', label: 'Other supporting document' },
];

export default function DocumentsPage() {
  const { data, isLoading, error, refetch } = useCompany();
  const uploadDoc = useUploadCompanyDoc();
  if (isLoading) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;
  const c = data.company;
  const security = c.services.some((s) => s === 'guards' || s === 'armed' || s === 'teams');

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" body="Uploading a new file replaces the previous one and sends it for review." />
      <div className="grid gap-3 md:grid-cols-2">
        {KINDS.filter((k) => !k.securityOnly || security).map((k) => {
          const doc = c.documents.find((d) => d.kind === k.kind);
          const busy = uploadDoc.isPending && uploadDoc.variables?.kind === k.kind;
          return (
            <Card key={k.kind} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{k.label}</p>
                  <p className="text-sm text-muted">
                    {doc ? `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString('en-GB')}` : k.required || k.securityOnly ? 'Required' : 'Optional'}
                  </p>
                </div>
                {doc ? (
                  <Badge tone={doc.status === 'verified' ? 'green' : doc.status === 'rejected' ? 'red' : 'amber'}>
                    {doc.status === 'verified' ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : 'In review'}
                  </Badge>
                ) : k.required || k.securityOnly ? (
                  <Badge tone="red">Missing</Badge>
                ) : null}
              </div>
              {doc?.note ? <p className="text-sm text-danger">{doc.note}</p> : null}
              <div className="flex gap-2">
                <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold hover:bg-surface">
                  <FileArrowUpIcon size={18} />
                  {busy ? 'Uploading...' : doc ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) uploadDoc.mutate({ kind: k.kind, file });
                    }}
                  />
                </label>
                {doc?.viewUrl ? (
                  <a
                    href={doc.viewUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-blue hover:bg-pale">
                    View <ArrowSquareOutIcon size={16} />
                  </a>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
      <FormError error={uploadDoc.error} />
    </div>
  );
}
