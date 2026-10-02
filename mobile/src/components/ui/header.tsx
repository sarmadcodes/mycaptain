import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, iconSize, iconStroke, radius, space } from '@/theme';

import { Text } from './text';

export function Header({ title, back = true }: { title?: string; back?: boolean }) {
  return (
    <View style={styles.bar}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && { backgroundColor: colors.surface }]}>
          <ChevronLeft color={colors.text} size={iconSize.lg} strokeWidth={iconStroke} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      {title ? (
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md },
  back: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
});
