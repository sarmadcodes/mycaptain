import { router } from 'expo-router';
import { ArrowRight, Car, ChevronDown, MapPin, ShieldCheck } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Card, ListRow, Section, Text } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { bookings, findStaff, statusLabel } from '@/lib/mock-data';
import { useAuth } from '@/stores/auth';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';
import type { ServiceType } from '@/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function CustomerHome() {
  const name = useAuth((s) => s.user?.name.split(' ')[0] ?? '');
  const reset = useBookingDraft((s) => s.reset);
  const active = bookings.find((b) => b.status === 'on_duty');
  const upcoming = bookings.filter((b) => b.status === 'confirmed');
  const activeStaff = findStaff(active?.staffId);

  const start = (service: ServiceType, path: '/book/driver/vehicle' | '/book/security/type') => {
    reset(service);
    router.push(path);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View style={{ gap: 2 }}>
            <Text variant="label" tone="muted">
              {greeting()}
            </Text>
            <Text variant="title">{name}</Text>
          </View>
          <Pressable style={styles.city} accessibilityRole="button" accessibilityLabel="Service city">
            <MapPin color={colors.blue} size={iconSize.sm} strokeWidth={iconStroke} />
            <Text variant="label">Karachi</Text>
            <ChevronDown color={colors.textMuted} size={iconSize.sm} strokeWidth={iconStroke} />
          </Pressable>
        </View>

        <Text variant="display" style={styles.headline}>
          What do you need today?
        </Text>

        <View style={styles.services}>
          <Pressable
            onPress={() => start('driver', '/book/driver/vehicle')}
            style={({ pressed }) => [styles.serviceMain, pressed && styles.pressed]}>
            <Car color={colors.onPrimary} size={28} strokeWidth={iconStroke} />
            <View style={{ gap: 4 }}>
              <Text variant="title" tone="inverse">
                Hire a driver
              </Text>
              <Text variant="label" style={{ color: '#B7C2D6' }}>
                For your own car. Hourly, daily or contract.
              </Text>
            </View>
            <View style={styles.arrow}>
              <ArrowRight color={colors.navy} size={iconSize.md} strokeWidth={iconStroke} />
            </View>
          </Pressable>
          <Pressable
            onPress={() => start('guard', '/book/security/type')}
            style={({ pressed }) => [styles.serviceAlt, pressed && styles.pressed]}>
            <ShieldCheck color={colors.blue} size={26} strokeWidth={iconStroke} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading">Book security</Text>
              <Text variant="label" tone="muted">
                Guard, armed gunman or a team
              </Text>
            </View>
            <ArrowRight color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
          </Pressable>
        </View>

        {active && activeStaff ? (
          <Section title="Active now">
            <Pressable onPress={() => router.push(`/booking/${active.id}`)}>
              <Card style={styles.active}>
                <Avatar name={activeStaff.name} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Badge label={statusLabel[active.status].label} tone={statusLabel[active.status].tone} />
                  <Text variant="heading">{activeStaff.name}</Text>
                  <Text variant="label" tone="muted">
                    {active.title}, {active.location}
                  </Text>
                </View>
                <Text variant="label" tone="accent">
                  Track
                </Text>
              </Card>
            </Pressable>
          </Section>
        ) : null}

        {upcoming.length ? (
          <Section title="Upcoming" action={{ label: 'See all', onPress: () => router.push('/bookings') }}>
            {upcoming.map((b) => (
              <ListRow
                key={b.id}
                icon={b.service === 'driver' ? Car : ShieldCheck}
                title={b.title}
                subtitle={`${b.when}, ${b.location}`}
                onPress={() => router.push(`/booking/${b.id}`)}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xxl, paddingBottom: space.xxxl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  headline: { marginBottom: -space.md },
  services: { gap: space.md },
  serviceMain: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: space.xl, gap: space.xl, minHeight: 190 },
  arrow: {
    position: 'absolute',
    right: space.xl,
    top: space.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.paleBlue,
    borderRadius: radius.xl,
    padding: space.xl,
  },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  active: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
