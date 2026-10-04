import { Redirect } from 'expo-router';

import { homeFor, useAuth } from '@/stores/auth';

// Entry point: send each role to its own area of the single app.
export default function Index() {
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href={homeFor(user.role)} />;
}
