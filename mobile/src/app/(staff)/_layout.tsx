import { Redirect, Stack } from 'expo-router';

import { homeFor, isStaff, useAuth } from '@/stores/auth';

export default function StaffLayout() {
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/welcome" />;
  if (!isStaff(user.role)) return <Redirect href={homeFor(user.role)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
