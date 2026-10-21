// Chat, cases, duty, SOS, ratings, notifications and earnings. Live socket events refresh these keys.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, toApiError } from '@/services/api/client';
import type { ApiBooking, ApiUser, CaseApi, CaseStatus, CaseType, ChatMessage, Earnings, NotificationApi, SosApi } from '@/types/api';

async function call<T>(p: Promise<{ data: T }>) {
  try {
    return (await p).data;
  } catch (e) {
    throw toApiError(e);
  }
}

// ---------- Chat ----------

export const useMessages = (bookingId?: string) =>
  useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => call(api.get<{ messages: ChatMessage[] }>(`/bookings/${bookingId}/messages`)),
    enabled: !!bookingId,
  });

export function useSendMessage(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => call(api.post<{ message: ChatMessage }>(`/bookings/${bookingId}/messages`, { text })),
    onSuccess: ({ message }) => addMessage(qc, message),
  });
}

// Adds a message to the cached thread once, whether it came from the reply or the socket.
export function addMessage(qc: ReturnType<typeof useQueryClient>, m: ChatMessage) {
  qc.setQueryData(['messages', m.booking], (old: { messages: ChatMessage[] } | undefined) =>
    old && !old.messages.some((x) => x.id === m.id) ? { messages: [...old.messages, m] } : old,
  );
}

// ---------- Duty ----------

export function useDutyEvent(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { kind: 'check_in' | 'break_start' | 'break_end'; lat?: number; lng?: number; note?: string }) =>
      call(api.post<{ booking: ApiBooking }>(`/bookings/${bookingId}/events`, v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', bookingId] }),
  });
}

export const sendLocation = (bookingId: string, v: { lat: number; lng: number; accuracy?: number; heading?: number }) =>
  call(api.post(`/bookings/${bookingId}/location`, v));

// ---------- SOS ----------

export function useSos() {
  return useMutation({
    mutationFn: (v: { bookingId?: string; lat?: number; lng?: number; note?: string }) => call(api.post<{ sos: SosApi }>('/sos', v)),
  });
}

export const useSosList = (status?: SosApi['status']) =>
  useQuery({ queryKey: ['sos', status ?? 'all'], queryFn: () => call(api.get<{ items: SosApi[] }>('/sos', { params: { status } })) });

export function useSosStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'acknowledged' | 'resolved' }) => call(api.post(`/sos/${id}/status`, { status })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sos'] }),
  });
}

// ---------- Ratings ----------

export function useRate(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { stars: number; comment?: string }) => call(api.post<{ booking: ApiBooking }>(`/bookings/${bookingId}/rating`, v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', bookingId] }),
  });
}

// ---------- Cases ----------

export const useCases = (status?: CaseStatus) =>
  useQuery({ queryKey: ['cases', status ?? 'all'], queryFn: () => call(api.get<{ items: CaseApi[] }>('/cases', { params: { status } })) });

export const useCase = (id?: string) =>
  useQuery({ queryKey: ['case', id], queryFn: () => call(api.get<{ case: CaseApi }>(`/cases/${id}`)), enabled: !!id });

export function useOpenCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { type: CaseType; bookingId?: string; details: string; urgent?: boolean; files?: { uri: string; name: string; type: string }[] }) => {
      const { files, ...input } = v;
      const { case: c } = await call(api.post<{ case: CaseApi }>('/cases', input));
      // Evidence goes up after the case exists; a failed photo does not lose the report.
      let failed = 0;
      for (const f of files ?? []) {
        const form = new FormData();
        form.append('file', f as unknown as Blob);
        try {
          await call(api.post(`/cases/${c.id}/evidence`, form, { headers: { 'content-type': 'multipart/form-data' } }));
        } catch {
          failed++;
        }
      }
      return { case: c, failed };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { status?: CaseStatus; reply?: string; note?: string; resolution?: string }) => call(api.patch<{ case: CaseApi }>(`/cases/${id}`, v)),
    onSuccess: ({ case: c }) => {
      qc.setQueryData(['case', id], { case: c });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

// ---------- Me ----------

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => call(api.get<{ items: NotificationApi[]; unread: number }>('/me/notifications')) });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => call(api.post('/me/notifications/read', { ids })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export const useEarnings = (days = 7) =>
  useQuery({ queryKey: ['earnings', days], queryFn: () => call(api.get<Earnings>('/me/earnings', { params: { days } })) });

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => call(api.get<{ user: ApiUser & { company?: { legalName: string; tradingName?: string } } }>('/auth/me')) });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name?: string; email?: string; available?: boolean; availability?: ApiUser['availability'] }) =>
      call(api.patch<{ user: ApiUser }>('/auth/me', v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export const useMyCompany = () =>
  useQuery({
    queryKey: ['my-company'],
    queryFn: () =>
      call(
        api.get<{ company: { name: string; ref: string; verified: boolean; office: string; licence?: string; supervisor: { name: string; phone: string } } }>(
          '/me/company',
        ),
      ),
  });

export function useChangePassword() {
  return useMutation({
    mutationFn: (v: { current: string; next: string }) => call(api.post<{ accessToken: string; refreshToken: string; user: ApiUser }>('/auth/password', v)),
  });
}
