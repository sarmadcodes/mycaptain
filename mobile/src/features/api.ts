// Data hooks over the My Captain API. Live socket events invalidate these keys (services/socket).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, toApiError } from '@/services/api/client';
import type { ApiBooking, BookingStatus, CompanyApi, Page, Price, Rates, RentalCarApi, StaffProfileApi } from '@/types/api';

const get = async <T>(url: string, params?: object) => {
  try {
    return (await api.get<T>(url, { params })).data;
  } catch (e) {
    throw toApiError(e);
  }
};
const post = async <T>(url: string, body?: object) => {
  try {
    return (await api.post<T>(url, body)).data;
  } catch (e) {
    throw toApiError(e);
  }
};

// ---------- Bookings ----------

export type BookingInput = {
  service: ApiBooking['service'];
  plan: ApiBooking['plan'];
  asap: boolean;
  startAt?: string;
  hours?: number;
  days?: number;
  contractMonths?: 6 | 12;
  vehicle?: { class: 'small' | 'sedan' | 'suv' | 'luxury'; makeModel?: string; engine?: string; transmission: 'automatic' | 'manual'; notes?: string };
  carId?: string;
  personnel: number;
  location: { address: string; point?: string };
  instructions?: string;
  requestedStaffId?: string;
};

export const useBookings = (status?: BookingStatus[]) =>
  useQuery({
    queryKey: ['bookings', status?.join(',') ?? 'all'],
    queryFn: () => get<Page<ApiBooking>>('/bookings', { status: status?.join(','), limit: 50 }),
  });

export const useBooking = (id?: string) =>
  useQuery({
    queryKey: ['booking', id],
    queryFn: () => get<{ booking: ApiBooking; next: BookingStatus[] }>(`/bookings/${id}`),
    enabled: !!id,
  });

export const useQuote = (input: BookingInput | null) =>
  useQuery({
    queryKey: ['quote', input],
    queryFn: () => post<{ price: Price; startAt: string }>('/bookings/quote', input!),
    enabled: !!input,
    retry: false,
  });

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingInput) => post<{ booking: ApiBooking }>('/bookings', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useTransition(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { to: BookingStatus; note?: string }) => post<{ booking: ApiBooking }>(`/bookings/${id}/status`, v),
    onSuccess: ({ booking }) => {
      qc.setQueryData(['booking', id], (old: { next: BookingStatus[] } | undefined) => ({ next: old?.next ?? [], booking }));
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ---------- Catalog ----------

export const useRates = () => useQuery({ queryKey: ['rates'], queryFn: () => get<{ rates: Rates }>('/rates'), staleTime: 5 * 60_000 });

export const useCars = () => useQuery({ queryKey: ['cars'], queryFn: () => get<{ cars: RentalCarApi[] }>('/cars') });

export const useStaffProfiles = (kind: 'driver' | 'guard' | 'gunman') =>
  useQuery({ queryKey: ['staff-profiles', kind], queryFn: () => get<{ staff: StaffProfileApi[] }>('/staff', { kind }) });

// ---------- Admin ----------

export const useOverview = () =>
  useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () =>
      get<{
        kpis: { activeDuties: number; arriving: number; awaitingAssignment: number; pendingPartners: number; paidToday: number };
        live: ApiBooking[];
      }>('/admin/overview'),
    refetchInterval: 60_000,
  });

export const useCompanies = (status?: CompanyApi['status']) =>
  useQuery({ queryKey: ['admin', 'companies', status ?? 'all'], queryFn: () => get<Page<CompanyApi>>('/companies', { status, limit: 100 }) });

export const useCompany = (id?: string) =>
  useQuery({
    queryKey: ['admin', 'company', id],
    queryFn: () => get<{ company: CompanyApi; staffCount: number }>(`/companies/${id}`),
    enabled: !!id,
  });

export function useReviewCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { decision: 'approve' | 'request_changes' | 'reject' | 'suspend'; note?: string }) =>
      post<{ company: CompanyApi }>(`/companies/${id}/review`, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAssignCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => post<{ booking: ApiBooking }>(`/bookings/${id}/assign-company`, { companyId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Rates) => {
      try {
        return (await api.put<{ rates: Rates }>('/rates', r)).data;
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rates'] }),
  });
}
