import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/stores/auth';
import { colors, space } from '@/theme';

// Temporary body for routes whose real screen is not built yet.
export function PlaceholderScreen({ title }: { title: string }) {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text variant="title">{title}</Text>
        <Text tone="muted">Screen coming in the next step.</Text>
        {user ? (
          <Text variant="label" tone="muted">
            Signed in as {user.name} ({user.role})
          </Text>
        ) : null}
      </View>
      {user ? (
        <View style={styles.footer}>
          <Button
            label="Sign out"
            variant="secondary"
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: space.xl, gap: space.sm },
  footer: { padding: space.xl },
});
