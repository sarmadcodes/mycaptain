import { router } from 'expo-router';
import { ScrollText, Shield, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Button, ListRow, Text } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/lib/config';
import { useResponsive } from '@/lib/use-responsive';
import { api, errorMessage } from '@/services/api/client';
import { signOut } from '@/features/auth/api';
import { isStaff, useAuth } from '@/stores/auth';
import { colors, space } from '@/theme';

export type ProfileItem = { icon: LucideIcon; title: string; subtitle?: string; onPress: () => void };

// Shared by customers and staff; each passes its own menu.
export function Profile({ items }: { items: ProfileItem[] }) {
  const r = useResponsive();
  const user = useAuth((s) => s.user);
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

        <View>
          <ListRow icon={Shield} title="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <ListRow icon={ScrollText} title="Terms of service" onPress={() => Linking.openURL(TERMS_URL)} />
        </View>

        <View style={[{ gap: space.sm }, r.tablet ? styles.signOutTablet : undefined]}>
          <Button
            label="Sign out"
            variant="secondary"
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          />
          {user.role === 'customer' ? <DeleteAccount /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeleteAccount() {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.delete('/auth/me');
      await signOut();
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const confirm = () => {
    const title = 'Delete your account?';
    const body = 'Your name, number and email are removed and you are signed out. This cannot be undone.';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${title}\n\n${body}`)) remove();
      return;
    }
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <View style={{ gap: space.xs }}>
      <Button label="Delete account" variant="ghost" loading={busy} onPress={confirm} />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxxl },
  head: { flexDirection: 'row', alignItems: 'center' },
  headText: { flex: 1, minWidth: 0, gap: 4 },
  signOutTablet: { width: 320, maxWidth: '100%' },
});
