import { z } from 'zod';

import { isValidPkMobile, parseIdentifier } from '@/utils/phone';

const phone = z.string().refine(isValidPkMobile, 'Enter a valid mobile number, like 300 123 4567.');

export const phoneSchema = z.object({ phone });

const identifier = z.string().refine((v) => !!parseIdentifier(v), 'Enter your mobile number (300 123 4567) or email.');
export const signInSchema = z.object({ identifier });

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone,
  // Required: sign-in codes are sent to this address.
  email: z.email('Enter a valid email address. We send your code there.'),
});

export const staffSignInSchema = z.object({
  identifier,
  password: z.string().min(1, 'Enter your password.'),
});

export type PhoneForm = z.infer<typeof phoneSchema>;
export type SignInForm = z.infer<typeof signInSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
export type StaffSignInForm = z.infer<typeof staffSignInSchema>;
