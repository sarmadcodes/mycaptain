import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Clock, MessageCircle, MessageSquareWarning, Phone, RefreshCw } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { Avatar, Badge, Card, DetailRow, Header, ListRow, Screen, Section, Text } from '@/components/ui';
import { findBooking, findStaff, guardTimeline, statusLabel } from '@/lib/mock-data';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

const fmt = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

export function LiveDuty() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const booking = findBooking(id);
  const staff = findStaff(booking?.staffId);

  if (!booking || !staff) {
    return (
      <Screen header={<Header />}>
        <Text tone="muted">We could not find this booking.</Text>
      </Screen>
    );
  }

  const s = statusLabel[booking.status];
  const live = booking.status === 'on_duty';
  const isDriver = booking.service === 'driver';
  const progress = Math.min(1, booking.elapsedMinutes / (booking.totalHours * 60));
  const caseLink = (type: string) => router.push({ pathname: '/case/new', params: { type, booking: booking.id } });

  return (
    <Screen header={<Header title={booking.id} />}>
      <View style={styles.stack}>
        <LiveMap
          height={240}
          target={KARACHI}
          staff={live ? { latitude: KARACHI.latitude + 0.004, longitude: KARACHI.longitude - 0.003 } : undefined}
          geofenceMeters={isDriver ? undefined : 60}
        />

        <Card style={{ gap: space.lg }}>
          <View style={styles.staffRow}>
            <Avatar name={staff.name} size={52} />
            <View style={{ flex: 1, gap: 4 }}>
              <Badge label={s.label} tone={s.tone} />
              <Text variant="heading">{staff.name}</Text>
              <Text variant="label" tone="muted">
                {booking.title}
              </Text>
            </View>
          </View>

          {live ? (
            <View style={{ gap: space.sm }}>
              <View style={styles.progressHead}>
                <Text variant="label" tone="muted">
                  {fmt(booking.elapsedMinutes)} of {booking.durationLabel}
                </Text>
                <Text variant="label" tone="accent">
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Action icon={Phone} label="Call" onPress={() => Linking.openURL('tel:+923000000000')} />
            <Action icon={MessageCircle} label="Message" onPress={() => router.push(`/chat/${booking.id}`)} />
            <Action icon={Clock} label="Extend" onPress={() => router.push('/book/schedule')} />
          </View>
        </Card>

        <Card style={{ gap: 0 }}>
          <DetailRow label="When" value={booking.when} />
          <DetailRow label="Location" value={booking.location} />
          <DetailRow label="Location sharing" value={live ? 'Active while on duty' : 'Starts at check-in'} />
          <DetailRow label="Break" value="No active break" />
        </Card>

        {!isDriver && live ? (
          <Section title="Shift timeline">
            {guardTimeline.map((t) => (
              <View key={t.time} style={styles.timeRow}>
                <Text variant="label" tone="muted" style={{ width: 52 }}>
                  {t.time}
                </Text>
                <Text variant="body">{t.label}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        <Section title="Need help?">
          <View>
            <ListRow icon={RefreshCw} title="Request replacement" onPress={() => caseLink('replacement')} />
            <ListRow icon={AlertTriangle} title="Report accident" onPress={() => caseLink('accident')} />
            <ListRow icon={MessageSquareWarning} title="Make a complaint" onPress={() => caseLink('complaint')} />
          </View>
        </Section>
      </View>
    </Screen>
  );
}

function Action({ icon: Icon, label, onPress }: { icon: typeof Phone; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
      <Icon color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.paleBlue, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blue, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: space.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  timeRow: { flexDirection: 'row', gap: space.md },
});
