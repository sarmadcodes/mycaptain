import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, iconSize, iconStroke, radius, space } from '@/theme';

import { Text } from './text';

type SelectCardProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onPress: () => void;
};

// Large single-choice option (service type, payment method).
export function SelectCard({ title, subtitle, icon: Icon, selected, onPress }: SelectCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && { opacity: 0.85 }]}>
      {Icon ? (
        <View style={[styles.icon, selected && { backgroundColor: colors.bg }]}>
          <Icon color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="label" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  selected: { borderColor: colors.blue, backgroundColor: colors.paleBlue },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.blue },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue },
});
