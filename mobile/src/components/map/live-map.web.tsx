import { MapPin } from 'lucide-react-native';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

export type LatLng = { latitude: number; longitude: number };

type LiveMapProps = { staff?: LatLng; target?: LatLng; geofenceMeters?: number; height?: number; style?: ViewStyle };

// react-native-maps has no web support; the browser preview shows this stand-in.
export function LiveMap({ height = 220, style }: LiveMapProps) {
  return (
    <View style={[styles.wrap, { height }, style]}>
      <MapPin color={colors.blue} size={iconSize.lg} strokeWidth={iconStroke} />
      <Text variant="label" tone="muted">
        Live map shows on the phone app
      </Text>
    </View>
  );
}

export const KARACHI: LatLng = { latitude: 24.8138, longitude: 67.0611 };

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
