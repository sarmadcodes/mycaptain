import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { Text } from './text';

// Initials avatar until staff photos come from the backend.
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.36, color: colors.navy }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
});
