import Constants from 'expo-constants';
import { MapPin } from 'lucide-react-native';
import { Linking, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Text } from '@/components/ui';
import { colors, radius } from '@/theme';

export type LatLng = { latitude: number; longitude: number };

type LiveMapProps = {
  // Staff position (moving marker) and the customer pickup / post point.
  staff?: LatLng;
  target?: LatLng;
  // Draw the guard's allowed post boundary around target.
  geofenceMeters?: number;
  height?: number;
  style?: ViewStyle;
};

// In-app maps need a Google Maps key on Android (see app.config.ts).
const mapsEnabled = Platform.OS !== 'android' || Constants.expoConfig?.extra?.mapsEnabled === true;

export function LiveMap({ staff, target, geofenceMeters, height = 220, style }: LiveMapProps) {
  const center = staff ?? target ?? KARACHI;
  if (!mapsEnabled) {
    const point = staff ?? target;
    return (
      <View style={[styles.wrap, styles.fallback, { height }, style]}>
        <MapPin color={colors.blue} size={28} strokeWidth={1.75} />
        <Text variant="label" tone="muted" style={{ textAlign: 'center' }}>
          {staff ? 'Live location shared' : point ? 'Booking location' : 'Location appears once shared'}
        </Text>
        {point ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`)}
            style={styles.open}>
            <Text variant="label" tone="accent">
              Open in Google Maps
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return (
    <View style={[styles.wrap, { height }, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...center, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        showsCompass={false}
        toolbarEnabled={false}>
        {target ? <Marker coordinate={target} pinColor={colors.navy} /> : null}
        {staff ? <Marker coordinate={staff} pinColor={colors.blue} /> : null}
        {target && geofenceMeters ? (
          <Circle center={target} radius={geofenceMeters} strokeColor={colors.blue} fillColor="rgba(36,107,253,0.08)" />
        ) : null}
      </MapView>
    </View>
  );
}

export const KARACHI: LatLng = { latitude: 24.8138, longitude: 67.0611 };

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
  fallback: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  open: { paddingHorizontal: 12, paddingVertical: 6 },
});
