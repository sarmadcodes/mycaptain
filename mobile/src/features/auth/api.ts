import { api, ApiError, toApiError } from '@/services/api/client';
import { unregisterPush } from '@/lib/push';
import { disconnectSocket } from '@/services/socket';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';
import type { Session } from '@/types/api';
import { toE164 } from '@/utils/phone';

export type OtpPurpose = 'sign-in' | 'sign-up';

export { ApiError as AuthError };

export async function requestOtp(phone: string, purpose: OtpPurpose) {
  try {
    const { data } = await api.post<{ resendIn: number; devCode?: string }>('/auth/otp/request', { phone: toE164(phone), purpose });
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function verifyOtp(params: { phone: string; code: string; name?: string; email?: string }) {
  try {
    const { data } = await api.post<Session>('/auth/otp/verify', { ...params, phone: toE164(params.phone) });
    await useAuth.getState().setSession(data);
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

// Drivers, guards and admins. Partners manage their company on the partner website.
export async function staffSignIn(params: { phone: string; password: string }) {
  try {
    const { data } = await api.post<Session>('/auth/login', { identifier: toE164(params.phone), password: params.password });
    if (data.user.role === 'partner') {
      await api.post('/auth/logout', { refreshToken: data.refreshToken }).catch(() => {});
      throw new ApiError('Partner accounts are managed on the partner website.', 'use_partner_site');
    }
    await useAuth.getState().setSession(data);
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function signOut() {
  const { refreshToken, clear } = useAuth.getState();
  await unregisterPush();
  if (refreshToken) await api.post('/auth/logout', { refreshToken }).catch(() => {});
  disconnectSocket();
  queryClient.clear();
  await clear();
}
