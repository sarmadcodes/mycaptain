import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

// Shared shell for admin tab screens: title, optional subtitle, responsive centred column.
export function AdminPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const r = useResponsive();
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={[r.content, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          <Text variant="title">{title}</Text>
          {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.xl, paddingBottom: space.xxxl },
});
