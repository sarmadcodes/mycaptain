'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Booking, BookingStatus, Company, CompanyStatus } from '@/lib/types';

export type AdminCompany = Company & { registrationNo: string; ntn: string; yearEstablished: number; companyType: string; createdAt: string };

export type CaseItem = {
  id: string;
  ref: string;
  type: string;
  status: 'open' | 'in_progress' | 'resolved';
  urgent: boolean;
  details: string;
  resolution?: string;
  openedByRole: string;
  openedBy?: { id: string; name: string; role: string; phone?: string };
  booking?: { id: string; code: string; staff?: { name: string }[]; customer?: { name: string } };
  evidence: { id: string; url: string }[];
  timeline: { at: string; text: string; internal: boolean }[];
  createdAt: string;
};

export type SosItem = {
  id: string;
  status: 'open' | 'acknowledged' | 'resolved';
  note?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  raisedBy?: { name: string; phone: string; role: string };
  booking?: { id: string; code: string; location: { address: string } };
};

export type PayoutItem = {
  id: string;
  company: { legalName: string; tradingName?: string; ref: string };
  periodStart: string;
  periodEnd: string;
  count: number;
  amount: number;
  status: 'scheduled' | 'paid';
  reference?: string;
  paidAt?: string;
};

export type Rates = {
  driverHourly: Record<'small' | 'sedan' | 'suv' | 'luxury', number>;
  guardHourly: number;
  gunmanHourly: number;
  planDiscount: Record<'hourly' | 'daily' | 'monthly' | 'contract', number>;
  feePercent: number;
  rentalMinHours: number;
};

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export const useOverview = () =>
  useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () =>
      api<{ kpis: { activeDuties: number; arriving: number; awaitingAssignment: number; pendingPartners: number; paidToday: number }; live: Booking[] }>(
        '/admin/overview',
      ),
    refetchInterval: 60_000,
  });

export const useCompanies = (status?: CompanyStatus) =>
  useQuery({
    queryKey: ['admin', 'companies', status ?? 'all'],
    queryFn: () => api<{ items: AdminCompany[]; total: number }>(`/companies?limit=100${status ? `&status=${status}` : ''}`),
  });

export const useAdminCompany = (id: string) =>
  useQuery({ queryKey: ['admin', 'company', id], queryFn: () => api<{ company: AdminCompany; staffCount: number }>(`/companies/${id}`) });

export function useReview(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { decision: 'approve' | 'request_changes' | 'reject' | 'suspend'; note?: string }) =>
      api(`/companies/${id}/review`, { method: 'POST', json: v }),
    onSuccess: () => invalidate('admin'),
  });
}

export const useAllBookings = (status?: BookingStatus[]) =>
  useQuery({
    queryKey: ['bookings', 'admin', status?.join(',') ?? 'all'],
    queryFn: () => api<{ items: Booking[]; total: number }>(`/bookings?limit=100${status ? `&status=${status.join(',')}` : ''}`),
  });

export const useAdminBooking = (id: string) =>
  useQuery({ queryKey: ['bookings', 'one', id], queryFn: () => api<{ booking: Booking; next: BookingStatus[] }>(`/bookings/${id}`) });

export function useBookingAction(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { kind: 'company'; companyId: string } | { kind: 'status'; to: BookingStatus; note?: string }) =>
      v.kind === 'company'
        ? api(`/bookings/${id}/assign-company`, { method: 'POST', json: { companyId: v.companyId } })
        : api(`/bookings/${id}/status`, { method: 'POST', json: { to: v.to, note: v.note } }),
    onSuccess: () => invalidate('bookings', 'admin'),
  });
}

export const useCases = () => useQuery({ queryKey: ['cases'], queryFn: () => api<{ items: CaseItem[] }>('/cases') });
export const useCase = (id: string) => useQuery({ queryKey: ['cases', id], queryFn: () => api<{ case: CaseItem }>(`/cases/${id}`) });

export function useUpdateCase(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { status?: CaseItem['status']; reply?: string; note?: string; resolution?: string }) => api(`/cases/${id}`, { method: 'PATCH', json: v }),
    onSuccess: () => invalidate('cases'),
  });
}

export const useSos = () => useQuery({ queryKey: ['sos'], queryFn: () => api<{ items: SosItem[] }>('/sos'), refetchInterval: 30_000 });

export function useSosStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'acknowledged' | 'resolved' }) => api(`/sos/${id}/status`, { method: 'POST', json: { status } }),
    onSuccess: () => invalidate('sos'),
  });
}

export const usePayouts = () => useQuery({ queryKey: ['payouts'], queryFn: () => api<{ items: PayoutItem[] }>('/admin/payouts') });

export const usePayoutPreview = (from: string, to: string) =>
  useQuery({
    queryKey: ['payouts', 'preview', from, to],
    queryFn: () =>
      api<{ items: { company: { id: string; name?: string }; count: number; amount: number; fees: number }[] }>(
        `/admin/payouts/preview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
  });

export function usePayoutActions() {
  const invalidate = useInvalidate();
  const generate = useMutation({
    mutationFn: (v: { from: string; to: string }) => api<{ created: number }>('/admin/payouts/generate', { method: 'POST', json: v }),
    onSuccess: () => invalidate('payouts'),
  });
  const paid = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) => api(`/admin/payouts/${id}/paid`, { method: 'POST', json: { reference } }),
    onSuccess: () => invalidate('payouts'),
  });
  return { generate, paid };
}

export const useRates = () => useQuery({ queryKey: ['rates'], queryFn: () => api<{ rates: Rates }>('/rates') });

export function useSaveRates() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (r: Rates) => api('/rates', { method: 'PUT', json: r }), onSuccess: () => invalidate('rates') });
}
