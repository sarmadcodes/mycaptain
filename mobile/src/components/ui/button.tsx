import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/theme';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
};

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.blue, fg: colors.onPrimary },
  secondary: { bg: colors.bg, fg: colors.text, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.blue },
  inverse: { bg: colors.bg, fg: colors.navy },
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style }: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border ?? 'transparent' },
        pressed && styles.pressed,
        inactive && !loading && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant="heading" numberOfLines={1} style={{ color: p.fg }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  disabled: { opacity: 0.4 },
});
