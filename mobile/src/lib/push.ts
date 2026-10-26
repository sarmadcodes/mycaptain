import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { notificationTarget as target } from '@/features/notification-target';
import { queryClient } from '@/lib/query-client';
import { api } from '@/services/api/client';
import { useAuth } from '@/stores/auth';

// Push notifications via Expo. The backend sends one for every in-app notification.
// Needs a development or store build (Expo Go on Android cannot receive pushes).

let registered: string | null = null;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

async function channels() {
  if (Platform.OS !== 'android') return;
  // import/namespace cannot follow expo-notifications' re-exports on Linux; AndroidImportance exists.
  // eslint-disable-next-line import/namespace
  await Notifications.setNotificationChannelAsync('default', { name: 'Bookings and messages', importance: Notifications.AndroidImportance.DEFAULT });
  await Notifications.setNotificationChannelAsync('urgent', {
    name: 'Emergencies',
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400],
    bypassDnd: true,
  });
}

async function register(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  await channels();
  const current = await Notifications.getPermissionsAsync();
  const status = current.granted ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.post('/me/push-token', { token, platform: Platform.OS });
  return token;
}

// Called before sign-out so the device stops receiving this account's notifications.
export async function unregisterPush() {
  if (!registered) return;
  await api.delete('/me/push-token', { data: { token: registered } }).catch(() => {});
  registered = null;
}

// Mounted once at the root: registers after sign-in and routes taps on notifications.
export function usePushNotifications() {
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    let cancelled = false;
    register()
      .then((t) => {
        if (!cancelled) registered = t;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    const open = (r: Notifications.NotificationResponse) => {
      const link = r.notification.request.content.data?.link as { kind: string; id: string } | undefined;
      const to = target(user.role, link);
      if (to) router.push(to);
    };
    // App opened from a notification while it was closed.
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const tap = Notifications.addNotificationResponseReceivedListener(open);
    // While the app is open, keep the in-app alerts fresh too.
    const received = Notifications.addNotificationReceivedListener(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
    return () => {
      tap.remove();
      received.remove();
    };
  }, [user]);
}
