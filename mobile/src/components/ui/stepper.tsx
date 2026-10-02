import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, iconSize, iconStroke, radius, space } from '@/theme';

import { Text } from './text';

type StepperProps = { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string };

export function Stepper({ value, onChange, min = 1, max = 20, suffix }: StepperProps) {
  return (
    <View style={styles.row}>
      <StepButton icon="minus" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text variant="heading" style={styles.value}>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </Text>
      <StepButton icon="plus" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({ icon, disabled, onPress }: { icon: 'plus' | 'minus'; disabled: boolean; onPress: () => void }) {
  const Icon = icon === 'plus' ? Plus : Minus;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'plus' ? 'Increase' : 'Decrease'}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, (pressed || disabled) && { opacity: disabled ? 0.35 : 0.6 }]}>
      <Icon color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 72, textAlign: 'center' },
});
