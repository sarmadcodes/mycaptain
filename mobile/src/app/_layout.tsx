import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { queryClient } from '@/lib/query-client';
import { api } from '@/services/api/client';
import { useLiveConnection } from '@/services/socket';
import { useAuth } from '@/stores/auth';
import type { ApiUser } from '@/types/api';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const hydrated = useAuth((s) => s.hydrated);
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <SessionSync />
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

// Keeps the live connection on the current session and refreshes the stored profile once per launch.
function SessionSync() {
  useLiveConnection();
  const signedIn = useAuth((s) => !!s.refreshToken);
  const setUser = useAuth((s) => s.setUser);
  useEffect(() => {
    if (!signedIn) return;
    api
      .get<{ user: ApiUser }>('/auth/me')
      .then(({ data }) => setUser({ ...data.user, company: typeof data.user.company === 'object' ? data.user.company.id : data.user.company }))
      .catch(() => {}); // a rejected session is cleared by the API client
  }, [signedIn, setUser]);
  return null;
}
