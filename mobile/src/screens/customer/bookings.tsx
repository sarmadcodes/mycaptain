import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Button, Card, ChipGroup, Text } from '@/components/ui';
import { bookings, findStaff, statusLabel, type Booking } from '@/lib/mock-data';
import { colors, iconStroke, space } from '@/theme';

type Tab = 'active' | 'upcoming' | 'past';

const inTab: Record<Tab, (b: Booking) => boolean> = {
  active: (b) => ['on_duty', 'arriving', 'assigning'].includes(b.status),
  upcoming: (b) => ['confirmed', 'paid', 'pending_payment'].includes(b.status),
  past: (b) => ['completed', 'closed'].includes(b.status),
};

export function CustomerBookings() {
  const [tab, setTab] = useState<Tab>('active');
  const list = bookings.filter(inTab[tab]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Bookings</Text>
        <ChipGroup
          value={tab}
          onChange={setTab}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Past', value: 'past' },
          ]}
        />
        {list.length ? (
          list.map((b) => <BookingCard key={b.id} booking={b} />)
        ) : (
          <View style={styles.empty}>
            <CalendarDays color={colors.textFaint} size={32} strokeWidth={iconStroke} />
            <Text variant="heading">Nothing here yet</Text>
            <Text tone="muted" style={{ textAlign: 'center' }}>
              Your {tab} bookings will show up here.
            </Text>
            <Button label="Book a service" variant="secondary" onPress={() => router.push('/home')} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const staff = findStaff(booking.staffId);
  const s = statusLabel[booking.status];
  return (
    <Pressable onPress={() => router.push(`/booking/${booking.id}`)}>
      <Card style={{ gap: space.md }}>
        <View style={styles.cardTop}>
          <Badge label={s.label} tone={s.tone} />
          <Text variant="caption" tone="muted">
            {booking.id}
          </Text>
        </View>
        <Text variant="heading">{booking.title}</Text>
        <Text variant="label" tone="muted">
          {booking.when}, {booking.location}
        </Text>
        {staff ? (
          <View style={styles.staff}>
            <Avatar name={staff.name} size={32} />
            <Text variant="label">{staff.name}</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  staff: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.xs },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl },
});
