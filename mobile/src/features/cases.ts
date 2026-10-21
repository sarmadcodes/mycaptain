import type { CaseStatus, CaseType } from '@/types/api';

export const CASE_TYPE_LABEL: Record<CaseType, string> = {
  complaint: 'Complaint',
  replacement: 'Replacement',
  accident: 'Accident',
  incident: 'Incident',
  payment: 'Payment',
  other: 'Other',
};

export const CASE_STATUS_LABEL: Record<CaseStatus, { label: string; tone: 'amber' | 'blue' | 'green' }> = {
  open: { label: 'Open', tone: 'amber' },
  in_progress: { label: 'In progress', tone: 'blue' },
  resolved: { label: 'Resolved', tone: 'green' },
};

export const caseTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
