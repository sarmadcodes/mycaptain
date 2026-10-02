import { StyleSheet, View, type ViewStyle } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

export function LiveMap({ staff, target, geofenceMeters, height = 220, style }: LiveMapProps) {
  const center = staff ?? target ?? KARACHI;
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
});
