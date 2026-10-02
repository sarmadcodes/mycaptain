import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/theme';

export function Card({ children, style, tinted }: { children: ReactNode; style?: ViewStyle; tinted?: boolean }) {
  return <View style={[styles.card, tinted && styles.tinted, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    padding: space.lg,
  },
  tinted: { backgroundColor: colors.paleBlue, borderColor: colors.paleBlue },
});
