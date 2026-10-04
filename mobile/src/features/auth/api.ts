import type { Role, User } from '@/types';
import { toE164 } from '@/utils/phone';

// TODO(backend): replace these mocks with real calls through services/api/client.ts:
//   POST /auth/otp/request   { phone, purpose }
//   POST /auth/otp/verify    { phone, code, name?, email? } -> { token, user }
//   POST /auth/staff/login   { phone, password }           -> { token, user }
// Until then any 6-digit code works, and staff accounts are recognised by password.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type OtpPurpose = 'sign-in' | 'sign-up';

export class AuthError extends Error {}

export async function requestOtp(phone: string, _purpose: OtpPurpose) {
  await wait(700);
  return { phone: toE164(phone), resendIn: 30 };
}

export async function verifyOtp(params: {
  phone: string;
  code: string;
  name?: string;
  email?: string;
}): Promise<{ token: string; user: User }> {
  await wait(800);
  if (params.code.length !== 6) throw new AuthError('Enter the 6-digit code.');
  return {
    token: 'mock-customer-token',
    user: {
      id: 'cus_1',
      name: params.name ?? 'Aziz Mughal',
      phone: toE164(params.phone),
      email: params.email,
      role: 'customer',
    },
  };
}

export async function staffSignIn(params: { phone: string; password: string }): Promise<{ token: string; user: User }> {
  await wait(900);
  if (params.password.length < 6) throw new AuthError('Phone number or password is incorrect.');
  // Mock: passwords starting with "admin" sign in as operations admin, "g" as a guard, anything else as a driver.
  const role: Role = params.password.startsWith('admin') ? 'admin' : params.password.startsWith('g') ? 'guard' : 'driver';
  return {
    token: `mock-${role}-token`,
    user: {
      id: `stf_${role}`,
      name: role === 'admin' ? 'Sara Ahmed' : role === 'guard' ? 'Usman Ali' : 'Ahmed Raza',
      phone: toE164(params.phone),
      role,
    },
  };
}
