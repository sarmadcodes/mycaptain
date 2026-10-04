import { Redirect, Stack } from 'expo-router';

import { homeFor, useAuth } from '@/stores/auth';

export default function AdminLayout() {
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/welcome" />;
  if (user.role !== 'admin') return <Redirect href={homeFor(user.role)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
