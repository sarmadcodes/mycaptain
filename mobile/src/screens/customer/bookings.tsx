import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Card, EmptyView, ErrorView, LoadingView, Segmented, Text } from '@/components/ui';
import { useBookings } from '@/features/api';
import { formatPKR } from '@/features/booking/pricing';
import { bookingTitle, isLive, isPast, isUpcoming, statusInfo, whenText } from '@/features/booking/labels';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';
import type { ApiBooking } from '@/types/api';

type Tab = 'active' | 'upcoming' | 'past';

const inTab: Record<Tab, (b: ApiBooking) => boolean> = {
  active: (b) => isLive(b.status),
  upcoming: (b) => isUpcoming(b.status),
  past: (b) => isPast(b.status),
};

export function CustomerBookings() {
  const r = useResponsive();
  const [tab, setTab] = useState<Tab>('active');
  const { data, isLoading, error, refetch, isRefetching } = useBookings();
  const list = (data?.items ?? []).filter(inTab[tab]);

  const cols = r.desktop ? 3 : r.tablet ? 2 : 1;
  const cardWidth = cols === 1 ? '100%' : r.columnWidth(cols, space.lg);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, r.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}>
        <Text variant="title">Bookings</Text>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Past', value: 'past' },
          ]}
        />
        {isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : list.length ? (
          <View style={styles.grid}>
            {list.map((b) => (
              <View key={b.id} style={{ width: cardWidth }}>
                <BookingCard booking={b} />
              </View>
            ))}
          </View>
        ) : (
          <EmptyView
            icon={CalendarDays}
            title="Nothing here yet"
            body={`Your ${tab} bookings will show up here.`}
            action={{ label: 'Book a service', onPress: () => router.push('/home') }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingCard({ booking: b }: { booking: ApiBooking }) {
  const s = statusInfo[b.status];
  const staff = b.staff[0];
  return (
    <Pressable onPress={() => router.push(`/booking/${b.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.cardTop}>
            <Badge label={s.label} tone={s.tone} />
            <Text variant="caption" tone="muted">
              {b.code}
            </Text>
          </View>
          <Text variant="heading">{bookingTitle(b)}</Text>
          <Text variant="label" tone="muted">
            {whenText(b.startAt)}, {b.location.address}
          </Text>
          <View style={styles.cardTop}>
            {staff ? (
              <View style={styles.staff}>
                <Avatar name={staff.name} size={28} />
                <Text variant="label" numberOfLines={1}>
                  {staff.name}
                  {b.staff.length > 1 ? ` +${b.staff.length - 1}` : ''}
                </Text>
              </View>
            ) : (
              <Text variant="label" tone="faint">
                Captain not assigned yet
              </Text>
            )}
            <Text variant="label">{formatPKR(b.price.total)}</Text>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.lg, paddingBottom: space.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  staff: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, minWidth: 0 },
});
