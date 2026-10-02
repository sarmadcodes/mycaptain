import { Redirect, Stack } from 'expo-router';

import { isStaff, useAuth } from '@/stores/auth';

export default function CustomerLayout() {
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/welcome" />;
  if (isStaff(user.role)) return <Redirect href="/jobs" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
