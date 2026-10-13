import { router } from 'expo-router';
import { ArrowRight, Car, CarFront, ChevronDown, MapPin, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Card, ListRow, Section, Select, Text } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { useBookings } from '@/features/api';
import { bookingTitle, isLive, isUpcoming, statusInfo, whenText } from '@/features/booking/labels';
import { useResponsive } from '@/lib/use-responsive';
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
  const r = useResponsive();
  const name = useAuth((s) => s.user?.name.split(' ')[0] ?? '');
  const reset = useBookingDraft((s) => s.reset);
  const { data } = useBookings();
  const items = data?.items ?? [];
  // Most urgent live booking first: on duty, arriving, confirmed, assigning.
  const order = ['on_duty', 'arriving', 'confirmed', 'assigning'];
  const active = items.filter((b) => isLive(b.status)).sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))[0];
  const upcoming = items.filter((b) => isUpcoming(b.status) || (isLive(b.status) && b.id !== active?.id)).slice(0, 4);
  const activeStaff = active?.staff[0];

  const [city, setCity] = useState('Karachi');

  const start = (service: ServiceType, path: '/book/driver/vehicle' | '/book/security/type' | '/book/rental/cars') => {
    reset(service);
    router.push(path);
  };

  // Two service cards sit side by side on tablets, stacked on phones.
  const servicesRow = r.tablet;
  // Upcoming rows become a grid on wide screens.
  const upcomingCols = r.desktop ? 2 : r.tablet ? 2 : 1;
  const upcomingWidth = r.columnWidth(upcomingCols, space.md);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, r.content, { gap: r.compact ? space.xl : space.xxl }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.greetingWrap}>
            <Text variant="label" tone="muted">
              {greeting()}
            </Text>
            <Text variant="title">{name}</Text>
          </View>
          <Select
            label="Service city"
            sheetTitle="Choose your city"
            value={city}
            onChange={setCity}
            options={[
              { label: 'Karachi', value: 'Karachi' },
              { label: 'Lahore', value: 'Lahore' },
              { label: 'Islamabad', value: 'Islamabad' },
              { label: 'Rawalpindi', value: 'Rawalpindi', hint: 'Coming soon', disabled: true },
              { label: 'Faisalabad', value: 'Faisalabad', hint: 'Coming soon', disabled: true },
            ]}
            trigger={(label) => (
              <View style={styles.city}>
                <MapPin color={colors.blue} size={iconSize.sm} strokeWidth={iconStroke} />
                <Text variant="label">{label}</Text>
                <ChevronDown color={colors.textMuted} size={iconSize.sm} strokeWidth={iconStroke} />
              </View>
            )}
          />
        </View>

        <Text variant="display" style={styles.headline}>
          What do you need today?
        </Text>

        <View style={[styles.services, servicesRow && styles.servicesRow]}>
          <Pressable
            onPress={() => start('driver', '/book/driver/vehicle')}
            style={({ pressed }) => [
              styles.serviceMain,
              { minHeight: r.compact ? 160 : r.tablet ? 220 : 190, padding: r.compact ? space.lg : space.xl },
              servicesRow && styles.flex1,
              pressed && styles.pressed,
            ]}>
            <Car color={colors.onPrimary} size={28} strokeWidth={iconStroke} />
            <View style={{ gap: 4, paddingRight: space.xxxl }}>
              <Text variant="title" tone="inverse">
                Hire a driver
              </Text>
              <Text variant="label" style={{ color: '#B7C2D6' }}>
                For your own car. Hourly, daily or contract.
              </Text>
            </View>
            <View style={[styles.arrow, r.compact && { right: space.lg, top: space.lg }]}>
              <ArrowRight color={colors.navy} size={iconSize.md} strokeWidth={iconStroke} />
            </View>
          </Pressable>
          <View style={[styles.side, servicesRow && styles.flex1]}>
            <Pressable
              onPress={() => start('rental', '/book/rental/cars')}
              style={({ pressed }) => [
                styles.serviceAlt,
                { padding: r.compact ? space.lg : space.xl },
                servicesRow && styles.flex1,
                pressed && styles.pressed,
              ]}>
              <CarFront color={colors.blue} size={26} strokeWidth={iconStroke} />
              <View style={styles.altText}>
                <Text variant="heading">Rent a car</Text>
                <Text variant="label" tone="muted">
                  Comes with a verified driver
                </Text>
              </View>
              <ArrowRight color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
            </Pressable>
            <Pressable
              onPress={() => start('guard', '/book/security/type')}
              style={({ pressed }) => [
                styles.serviceAlt,
                { padding: r.compact ? space.lg : space.xl },
                servicesRow && styles.flex1,
                pressed && styles.pressed,
              ]}>
              <ShieldCheck color={colors.blue} size={26} strokeWidth={iconStroke} />
              <View style={styles.altText}>
                <Text variant="heading">Book security</Text>
                <Text variant="label" tone="muted">
                  Bouncer, armed gunman or a team
                </Text>
              </View>
              <ArrowRight color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
            </Pressable>
          </View>
        </View>

        {active ? (
          <Section title="Active now">
            <Pressable onPress={() => router.push(`/booking/${active.id}`)}>
              <Card style={styles.active}>
                <Avatar name={activeStaff?.name ?? 'My Captain'} />
                <View style={styles.activeText}>
                  <Badge label={statusInfo[active.status].label} tone={statusInfo[active.status].tone} />
                  <Text variant="heading">{activeStaff?.name ?? statusInfo[active.status].customer}</Text>
                  <Text variant="label" tone="muted">
                    {bookingTitle(active)}, {active.location.address}
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
            <View style={styles.grid}>
              {upcoming.map((b) => (
                <View key={b.id} style={{ width: upcomingCols === 1 ? '100%' : upcomingWidth }}>
                  <ListRow
                    icon={b.service === 'driver' || b.service === 'rental' ? Car : ShieldCheck}
                    title={bookingTitle(b)}
                    subtitle={`${whenText(b.startAt)}, ${statusInfo[b.status].label}`}
                    onPress={() => router.push(`/booking/${b.id}`)}
                  />
                </View>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxxl },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  greetingWrap: { flex: 1, minWidth: 0, gap: 2 },
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
  servicesRow: { flexDirection: 'row', alignItems: 'stretch' },
  flex1: { flex: 1 },
  side: { gap: space.md },
  serviceMain: { backgroundColor: colors.navy, borderRadius: radius.xl, gap: space.xl },
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
  },
  altText: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  active: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  activeText: { flex: 1, minWidth: 0, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
