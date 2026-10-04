import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Button, ListRow, Text } from '@/components/ui';
import { useResponsive } from '@/lib/use-responsive';
import { isStaff, useAuth } from '@/stores/auth';
import { colors, space } from '@/theme';

export type ProfileItem = { icon: LucideIcon; title: string; subtitle?: string; onPress: () => void };

// Shared by customers and staff; each passes its own menu.
export function Profile({ items }: { items: ProfileItem[] }) {
  const r = useResponsive();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  if (!user) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, r.content, { gap: r.compact ? space.xl : space.xxl }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.head, { gap: r.compact ? space.md : space.lg }]}>
          <Avatar name={user.name} size={r.compact ? 56 : r.tablet ? 80 : 64} />
          <View style={styles.headText}>
            <Text variant="title">{user.name}</Text>
            <Text variant="label" tone="muted">
              {user.phone}
            </Text>
            {isStaff(user.role) ? <Badge label={`Verified ${user.role}`} tone="green" /> : null}
            {user.role === 'admin' ? <Badge label="Operations admin" tone="blue" /> : null}
          </View>
        </View>

        <View>
          {items.map((i) => (
            <ListRow key={i.title} icon={i.icon} title={i.title} subtitle={i.subtitle} onPress={i.onPress} />
          ))}
        </View>

        <View style={r.tablet ? styles.signOutTablet : undefined}>
          <Button
            label="Sign out"
            variant="secondary"
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxxl },
  head: { flexDirection: 'row', alignItems: 'center' },
  headText: { flex: 1, minWidth: 0, gap: 4 },
  signOutTablet: { width: 320, maxWidth: '100%' },
});
