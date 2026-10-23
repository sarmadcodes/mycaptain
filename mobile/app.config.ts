import type { ConfigContext, ExpoConfig } from 'expo/config';

// Adds build-time settings on top of app.json.
// EXPO_PUBLIC_GOOGLE_MAPS_KEY enables in-app Google Maps on Android; without it the app shows
// a location card with an "Open in Google Maps" button instead (Android crashes on a map with no key).
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}),
    },
    extra: { ...config.extra, mapsEnabled: !!mapsKey },
  };
};
