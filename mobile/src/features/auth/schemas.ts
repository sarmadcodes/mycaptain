import { z } from 'zod';

import { isValidPkMobile } from '@/utils/phone';

const phone = z.string().refine(isValidPkMobile, 'Enter a valid mobile number, like 300 123 4567.');

export const phoneSchema = z.object({ phone });

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone,
  // Required: sign-in codes are sent to this address.
  email: z.email('Enter a valid email address. We send your code there.'),
});

export const staffSignInSchema = z.object({
  phone,
  password: z.string().min(1, 'Enter your password.'),
});

export type PhoneForm = z.infer<typeof phoneSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
export type StaffSignInForm = z.infer<typeof staffSignInSchema>;
