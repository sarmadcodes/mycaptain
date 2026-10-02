import { router } from 'expo-router';
import { Car, ShieldCheck, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ListRow, Text } from '@/components/ui';
import { colors, radius, space } from '@/theme';

export function Welcome() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.hero}>
        <Text variant="label" style={styles.brand}>
          MY CAPTAIN
        </Text>
        <View style={styles.heroCopy}>
          <Text variant="display" tone="inverse">
            Trusted drivers and security, on demand.
          </Text>
          <Text variant="body" style={styles.heroSub}>
            Every captain is verified and assigned by My Captain.
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View>
          <ListRow icon={Car} title="Driver" subtitle="For your own car, by the hour or contract" />
          <ListRow icon={ShieldCheck} title="Security guard" subtitle="Home, office or event coverage" />
          <ListRow icon={Users} title="Armed security" subtitle="Licensed personnel and teams" />
        </View>
        <View style={styles.actions}>
          <Button label="Get started" onPress={() => router.push('/sign-in')} />
          <Button label="I work with My Captain" variant="ghost" onPress={() => router.push('/staff-sign-in')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  hero: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.lg, justifyContent: 'space-between' },
  brand: { color: colors.onPrimary, letterSpacing: 2.4, opacity: 0.9 },
  heroCopy: { gap: space.md, paddingBottom: space.xxl },
  heroSub: { color: '#B7C2D6' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    gap: space.xl,
  },
  actions: { gap: space.xs, paddingBottom: space.sm },
});
