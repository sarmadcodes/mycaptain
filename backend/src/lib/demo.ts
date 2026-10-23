import { env } from '@/config/env';

// Demo accounts for testers. Their addresses belong to strangers, so nothing is ever emailed to them,
// and with DEMO_MODE=true customer demo accounts sign in with DEMO_CODE instead of an emailed code.
// Turn DEMO_MODE off before real launch.
export const DEMO_EMAILS = new Set([
  'customer@gmail.com',
  'staff@gmail.com',
  'guard@gmail.com',
  'gunman@gmail.com',
  'partner@gmail.com',
  'pending@gmail.com',
  'admin@gmail.com',
]);

export const isDemoEmail = (email?: string | null) => !!email && DEMO_EMAILS.has(email.toLowerCase());
export const demoSignIn = (user: { email?: string | null }) => env.DEMO_MODE && isDemoEmail(user.email);
