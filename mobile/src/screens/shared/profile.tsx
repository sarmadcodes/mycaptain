import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Button, ListRow, Text } from '@/components/ui';
import { isStaff, useAuth } from '@/stores/auth';
import { colors, space } from '@/theme';

export type ProfileItem = { icon: LucideIcon; title: string; subtitle?: string };

// Shared by customers and staff; each passes its own menu.
export function Profile({ items }: { items: ProfileItem[] }) {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  if (!user) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar name={user.name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title">{user.name}</Text>
            <Text variant="label" tone="muted">
              {user.phone}
            </Text>
            {isStaff(user.role) ? (
              <Badge label={`Verified ${user.role}`} tone="green" />
            ) : null}
          </View>
        </View>

        <View>
          {items.map((i) => (
            // TODO: detail screens for each item.
            <ListRow key={i.title} icon={i.icon} title={i.title} subtitle={i.subtitle} onPress={() => {}} />
          ))}
        </View>

        <Button
          label="Sign out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xxl },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
});
