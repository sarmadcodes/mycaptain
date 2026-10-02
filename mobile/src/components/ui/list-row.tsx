import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, iconSize, iconStroke, radius, space } from '@/theme';

import { Text } from './text';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  trailing?: string;
};

export function ListRow({ title, subtitle, icon: Icon, onPress, trailing }: ListRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {Icon ? (
        <View style={styles.icon}>
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
      {trailing ? (
        <Text variant="label" tone="muted">
          {trailing}
        </Text>
      ) : null}
      {onPress ? <ChevronRight color={colors.textFaint} size={iconSize.md} strokeWidth={iconStroke} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderRadius: radius.md },
  pressed: { opacity: 0.6 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});
