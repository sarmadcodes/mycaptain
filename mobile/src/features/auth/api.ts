import { api, ApiError, toApiError } from '@/services/api/client';
import { unregisterPush } from '@/lib/push';
import { disconnectSocket } from '@/services/socket';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';
import type { Session } from '@/types/api';
import { parseIdentifier, toE164 } from '@/utils/phone';

export type OtpPurpose = 'sign-in' | 'sign-up';

export { ApiError as AuthError };

// The code goes by email or SMS, whichever the server is set to; `sentTo` says where.
// Sign-in may use the email instead of the number (pass phone undefined).
export async function requestOtp(phone: string | undefined, purpose: OtpPurpose, email?: string) {
  try {
    const { data } = await api.post<{ resendIn: number; devCode?: string; channel: 'sms' | 'email'; sentTo?: string; demo?: boolean }>('/auth/otp/request', {
      ...(phone ? { phone: toE164(phone) } : {}),
      purpose,
      ...(email ? { email } : {}),
    });
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function verifyOtp(params: { phone?: string; identifierEmail?: string; code: string; name?: string; email?: string }) {
  try {
    const { phone, ...rest } = params;
    const { data } = await api.post<Session>('/auth/otp/verify', { ...rest, ...(phone ? { phone: toE164(phone) } : {}) });
    await useAuth.getState().setSession(data);
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

// Drivers, guards and admins. Partners manage their company on the partner website.
export async function staffSignIn(params: { identifier: string; password: string }) {
  try {
    const id = parseIdentifier(params.identifier);
    const identifier = id && 'phone' in id ? toE164(id.phone) : params.identifier.trim().toLowerCase();
    const { data } = await api.post<Session>('/auth/login', { identifier, password: params.password });
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
