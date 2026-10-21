import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { sendLocation } from '@/features/ops';

import { toPosition } from './location';

// Staff phones share their position while a booking is arriving or on duty, so the customer and
// operations can follow them. Android keeps sharing in the background with a visible notification.

const TASK = 'mc-duty-location';
const INTERVAL_MS = 20_000;
const DISTANCE_M = 25;

let activeBooking: string | null = null;

// Background deliveries. Defined at module load, as TaskManager requires.
if (Platform.OS !== 'web') {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    // No duty known (e.g. the app was restarted in the background): stop rather than run orphaned.
    if (!activeBooking) return void (await stopBackground());
    if (error || !data?.locations?.length) return;
    const latest = data.locations[data.locations.length - 1]!;
    await sendLocation(activeBooking, toPosition(latest)).catch(async (e: { status?: number }) => {
      // 409: the duty is over (perhaps finished on another screen). Stop draining the battery.
      if (e?.status === 409) {
        activeBooking = null;
        await stopBackground();
      }
    });
  });
}

async function startBackground() {
  if (Platform.OS === 'web') return false;
  const bg = await Location.requestBackgroundPermissionsAsync().catch(() => ({ status: 'denied' as const }));
  if (bg.status !== 'granted') return false;
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) return true;
  await Location.startLocationUpdatesAsync(TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: INTERVAL_MS,
    distanceInterval: DISTANCE_M,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'My Captain duty in progress',
      notificationBody: 'Sharing your location with the customer and operations until the duty ends.',
      notificationColor: '#2F6BFF',
    },
  });
  return true;
}

async function stopBackground() {
  if (Platform.OS === 'web') return;
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) await Location.stopLocationUpdatesAsync(TASK);
}

export type SharingState = 'off' | 'starting' | 'foreground' | 'background' | 'denied';

// Shares location for `bookingId` while `active`. Falls back to foreground-only sharing when
// background permission is refused, and reports what is happening so the screen can say so.
export function useShareLocation(bookingId: string | undefined, active: boolean): SharingState {
  // Result for the booking it was computed for; anything else is still starting (or off).
  const [result, setResult] = useState<{ key: string; state: SharingState }>();
  const setState = (key: string) => (state: SharingState) => setResult({ key, state });

  useEffect(() => {
    if (!bookingId || !active) {
      activeBooking = null;
      stopBackground();
      return;
    }
    const set = setState(bookingId);
    let cancelled = false;
    let watcher: Location.LocationSubscription | undefined;
    activeBooking = bookingId;

    (async () => {
      const fg = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' as const }));
      if (cancelled) return;
      if (fg.status !== 'granted') return set('denied');

      // Always watch while the screen is open: immediate first fix and steady updates.
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: INTERVAL_MS, distanceInterval: DISTANCE_M },
        (l) => sendLocation(bookingId, toPosition(l)).catch(() => {}),
      );
      if (cancelled) return watcher.remove();
      const bg = await startBackground().catch(() => false);
      if (!cancelled) set(bg ? 'background' : 'foreground');
    })();

    return () => {
      cancelled = true;
      watcher?.remove();
    };
  }, [bookingId, active]);

  if (!bookingId || !active) return 'off';
  return result?.key === bookingId ? result.state : 'starting';
}

export const sharingText: Record<SharingState, string | null> = {
  off: null,
  starting: 'Starting location sharing...',
  foreground: 'Sharing your location while this screen is open. Allow "all the time" location to keep sharing in the background.',
  background: 'Sharing your location with the customer and operations until the duty ends.',
  denied: 'Location is off. Turn it on in settings so the customer and operations can see where you are.',
};
