'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, upload } from '@/lib/api';
import type { Booking, BookingStatus, Car, Company, Staff } from '@/lib/types';

export const useCompany = () => useQuery({ queryKey: ['company'], queryFn: () => api<{ company: Company }>('/companies/me') });

export const useStaff = () => useQuery({ queryKey: ['staff'], queryFn: () => api<{ staff: Staff[] }>('/companies/me/staff') });

export const useCars = () => useQuery({ queryKey: ['cars'], queryFn: () => api<{ cars: Car[] }>('/companies/me/cars') });

export const useBookings = (status?: BookingStatus[]) =>
  useQuery({
    queryKey: ['bookings', status?.join(',') ?? 'all'],
    queryFn: () => api<{ items: Booking[]; total: number }>(`/bookings?limit=100${status ? `&status=${status.join(',')}` : ''}`),
  });

export const useBooking = (id: string) =>
  useQuery({ queryKey: ['bookings', 'one', id], queryFn: () => api<{ booking: Booking; next: BookingStatus[] }>(`/bookings/${id}`) });

function useInvalidate(...keys: string[]) {
  const qc = useQueryClient();
  return () => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export function useAssignStaff(id: string) {
  const invalidate = useInvalidate('bookings');
  return useMutation({
    mutationFn: (staffIds: string[]) => api<{ booking: Booking }>(`/bookings/${id}/assign-staff`, { method: 'POST', json: { staffIds } }),
    onSuccess: invalidate,
  });
}

export function useAddStaff() {
  const invalidate = useInvalidate('staff');
  return useMutation({
    mutationFn: (v: { name: string; phone: string; staffKind: string; password: string }) =>
      api<{ staff: Staff }>('/companies/me/staff', { method: 'POST', json: v }),
    onSuccess: invalidate,
  });
}

export function useUpdateStaff() {
  const invalidate = useInvalidate('staff');
  return useMutation({
    mutationFn: ({ id, ...v }: { id: string; status?: 'active' | 'suspended'; password?: string; name?: string }) =>
      api<{ staff: Staff }>(`/companies/me/staff/${id}`, { method: 'PATCH', json: v }),
    onSuccess: invalidate,
  });
}

export function useUploadStaffDoc() {
  const invalidate = useInvalidate('staff');
  return useMutation({
    mutationFn: ({ id, kind, file }: { id: string; kind: string; file: File }) => {
      const f = new FormData();
      f.append('kind', kind);
      f.append('file', file);
      return upload<{ staff: Staff }>(`/companies/me/staff/${id}/documents`, f);
    },
    onSuccess: invalidate,
  });
}

export function useUploadCompanyDoc() {
  const invalidate = useInvalidate('company');
  return useMutation({
    mutationFn: ({ kind, file }: { kind: string; file: File }) => {
      const f = new FormData();
      f.append('kind', kind);
      f.append('file', file);
      return upload<{ company: Company }>('/companies/me/documents', f);
    },
    onSuccess: invalidate,
  });
}

export function useSaveCar() {
  const invalidate = useInvalidate('cars');
  return useMutation({
    mutationFn: ({ id, ...v }: Partial<Car> & { id?: string }) =>
      id ? api<{ car: Car }>(`/companies/me/cars/${id}`, { method: 'PATCH', json: v }) : api<{ car: Car }>('/companies/me/cars', { method: 'POST', json: v }),
    onSuccess: invalidate,
  });
}
