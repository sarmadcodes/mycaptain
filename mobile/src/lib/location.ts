import * as Location from 'expo-location';

export type Position = { lat: number; lng: number; accuracy?: number; heading?: number };

const toPosition = (l: Location.LocationObject): Position => ({
  lat: l.coords.latitude,
  lng: l.coords.longitude,
  accuracy: l.coords.accuracy ?? undefined,
  heading: l.coords.heading != null && l.coords.heading >= 0 ? l.coords.heading : undefined,
});

// Best-effort current position. Returns null when permission is refused or no fix arrives in time,
// so callers (SOS, reports) never wait on GPS to do their job.
export async function currentPosition(timeoutMs = 8000): Promise<Position | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).then(toPosition);
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
    return (await Promise.race([fresh, timeout])) ?? (last ? toPosition(last) : null);
  } catch {
    return null;
  }
}

export const describePosition = (p: Position) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.accuracy ? ` (within ${Math.round(p.accuracy)} m)` : ''}`;

export { toPosition };
