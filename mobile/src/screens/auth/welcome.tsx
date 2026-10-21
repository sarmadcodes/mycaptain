import { router } from 'expo-router';
import { Building2, Car, ShieldCheck, Users } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ListRow, Text } from '@/components/ui';
import { PARTNER_PORTAL_URL } from '@/lib/config';
import { useResponsive } from '@/lib/use-responsive';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

export function Welcome() {
  const { tablet, gutter } = useResponsive();

  return (
    <View style={[styles.root, tablet && styles.rootWide]}>
      <SafeAreaView edges={['top']} style={[styles.hero, { paddingHorizontal: gutter }, tablet && styles.heroWide]}>
        <Text variant="label" style={styles.brand}>
          MY CAPTAIN
        </Text>
        <View style={[styles.heroCopy, tablet && { maxWidth: 460 }]}>
          <Text variant="display" tone="inverse" style={tablet && { fontSize: 42, lineHeight: 48 }}>
            Trusted drivers and security, on demand.
          </Text>
          <Text variant="body" style={styles.heroSub}>
            Verified captains from licensed partner companies, assigned and tracked by My Captain.
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={[styles.sheet, { paddingHorizontal: gutter }, tablet && styles.sheetWide]}>
        <View style={tablet ? { width: '100%', maxWidth: 420, gap: space.xl } : { gap: space.xl }}>
          <View>
            <ListRow icon={Car} title="Driver" subtitle="For your own car, by the hour or contract" />
            <ListRow icon={ShieldCheck} title="Security guard" subtitle="Home, office or event coverage" />
            <ListRow icon={Users} title="Armed security" subtitle="Licensed personnel and teams" />
          </View>
          <View style={styles.actions}>
            <Button label="Get started" onPress={() => router.push('/sign-in')} />
            <Button label="Staff sign in" variant="ghost" onPress={() => router.push('/staff-sign-in')} />
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(PARTNER_PORTAL_URL)}
            style={({ pressed }) => [styles.partner, pressed && { opacity: 0.6 }]}>
            <Building2 color={colors.textMuted} size={iconSize.sm} strokeWidth={iconStroke} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              Run a driver or security company?{' '}
              <Text variant="caption" tone="accent">
                Become a partner
              </Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  rootWide: { flexDirection: 'row' },
  hero: { flex: 1, paddingTop: space.lg, justifyContent: 'space-between' },
  heroWide: { paddingVertical: space.xxxl },
  brand: { color: colors.onPrimary, letterSpacing: 2.4, opacity: 0.9 },
  heroCopy: { gap: space.md, paddingBottom: space.xxl },
  heroSub: { color: '#B7C2D6' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  sheetWide: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: { gap: space.xs },
  partner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, justifyContent: 'center', paddingVertical: space.sm },
});
