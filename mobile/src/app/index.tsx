import { Redirect } from 'expo-router';

import { isStaff, useAuth } from '@/stores/auth';

// Entry point: send each role to its own area of the single app.
export default function Index() {
  const user = useAuth((s) => s.user);

  if (!user) return <Redirect href="/welcome" />;
  if (isStaff(user.role)) return <Redirect href="/jobs" />;
  return <Redirect href="/home" />;
}
