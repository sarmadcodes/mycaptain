import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { space } from '@/theme';

import { Text } from './text';

type SectionProps = {
  title?: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
  style?: ViewStyle;
};

export function Section({ title, action, children, style }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <View style={styles.head}>
          <Text variant="heading">{title}</Text>
          {action ? (
            <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
              <Text variant="label" tone="accent">
                {action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
