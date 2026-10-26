import dayjs from 'dayjs';
import { router } from 'expo-router';
import { AlertTriangle, Coffee, Radio } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { SosButton } from '@/components/sos-button';
import { Badge, Button, Card, DetailRow, EmptyView, ErrorView, ListRow, LoadingView, Text } from '@/components/ui';
import { useBooking, useBookings } from '@/features/api';
import { durationText, statusInfo, whenText } from '@/features/booking/labels';
import { useDutyEvent } from '@/features/ops';
import { currentPosition } from '@/lib/location';
import { sharingText, useShareLocation } from '@/lib/tracking';
import { useResponsive } from '@/lib/use-responsive';
import { useWatchBooking } from '@/services/socket';
import { useAuth } from '@/stores/auth';
import { colors, iconSize, iconStroke, space } from '@/theme';

import { DutyControls } from './duty-controls';

const clock = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(Math.max(0, n)).padStart(2, '0')).join(':');

export function StaffDuty() {
  const r = useResponsive();
  const guard = useAuth((s) => s.user?.role === 'guard');
  const list = useBookings(['confirmed', 'arriving', 'on_duty']);
  // The duty to show: one in progress, otherwise the next confirmed job.
  const current =
    list.data?.items.find((b) => b.status === 'on_duty') ??
    list.data?.items.find((b) => b.status === 'arriving') ??
    [...(list.data?.items ?? [])].sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  const detail = useBooking(current?.id);
  useWatchBooking(current?.id);

  const [, tick] = useState(0);
  const b = detail.data?.booking;
  const live = b?.status === 'on_duty';
  const myId = useAuth((s) => s.user?.id);
  const event = useDutyEvent(b?.id ?? '');
  const sharing = useShareLocation(b?.id, b?.status === 'arriving' || live);

  // Break and check-in state comes from the server, so it survives restarts and other devices.
  const mine = (b?.events ?? []).filter((e) => e.by === myId);
  const breaks = mine.filter((e) => e.kind === 'break_start' || e.kind === 'break_end');
  const onBreak = breaks.at(-1)?.kind === 'break_start';
  const lastCheckIn = mine.filter((e) => e.kind === 'check_in').at(-1);
  const me = b?.locations?.find((l) => l.staff === myId);
  const here = me ? { latitude: me.lat, longitude: me.lng } : undefined;
  const target = b?.location.lat != null && b.location.lng != null ? { latitude: b.location.lat, longitude: b.location.lng } : undefined;

  const record = async (kind: 'check_in' | 'break_start' | 'break_end') => {
    const p = kind === 'check_in' ? await currentPosition(5000) : null;
    event.mutate({ kind, ...(p ? { lat: p.lat, lng: p.lng } : {}) });
  };
  useEffect(() => {
    if (!live || onBreak) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [live, onBreak]);
  const startedAt = b ? [...b.history].reverse().find((h) => h.status === 'on_duty')?.at : undefined;
  const seconds = startedAt ? dayjs().diff(dayjs(startedAt), 'second') : 0;

  const split = r.tablet;
  const gap = r.compact ? space.lg : space.xl;
  const hhmm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, r.content, { gap }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.blue} />}>
        <View style={styles.head}>
          <Text variant="title">Duty</Text>
          {b ? <Badge label={live && onBreak ? 'On break' : statusInfo[b.status].label} tone={live ? (onBreak ? 'amber' : 'green') : 'blue'} /> : null}
        </View>

        {list.isLoading || (current && detail.isLoading) ? (
          <LoadingView />
        ) : list.error || detail.error ? (
          <ErrorView error={list.error ?? detail.error} onRetry={() => (list.refetch(), detail.refetch())} />
        ) : !b || !detail.data ? (
          <EmptyView icon={Radio} title="No duty right now" body="When your company assigns you a job, it shows here." />
        ) : (
          <View style={[split && styles.bodySplit, { gap: split ? space.xxl : gap }]}>
            <View style={[{ gap }, split && styles.col]}>
              <LiveMap height={r.tablet ? 320 : 200} target={target ?? here ?? KARACHI} staff={here} geofenceMeters={guard && target ? 60 : undefined} />
              {sharingText[sharing] ? (
                <Text variant="caption" tone={sharing === 'denied' ? 'danger' : 'muted'}>
                  {sharingText[sharing]}
                </Text>
              ) : null}
              {live ? (
                <View style={styles.timer}>
                  <Text variant="caption" tone="muted">
                    Time on duty
                  </Text>
                  <Text style={[styles.time, { fontSize: r.compact ? 38 : r.tablet ? 52 : 44 }]}>{clock(seconds)}</Text>
                </View>
              ) : null}
            </View>

            <View style={[{ gap }, split && styles.col]}>
              <Card style={{ gap: 0 }}>
                <DetailRow label="Booking" value={b.code} />
                <DetailRow label="Starts" value={whenText(b.startAt)} />
                <DetailRow label={guard ? 'Post' : 'Pickup'} value={b.location.point ? `${b.location.point}, ${b.location.address}` : b.location.address} />
                <DetailRow label="Duration" value={durationText(b)} />
                {guard && live ? <DetailRow label="Last check-in" value={lastCheckIn ? hhmm(lastCheckIn.at) : 'At start'} /> : null}
              </Card>

              <DutyControls booking={b} next={detail.data.next} guard={guard} />

              {live ? (
                <View style={{ gap: space.md }}>
                  {guard ? (
                    <Button
                      label="Complete check-in"
                      variant="secondary"
                      loading={event.isPending && event.variables?.kind === 'check_in'}
                      onPress={() => record('check_in')}
                    />
                  ) : null}
                  <Button
                    label={onBreak ? 'End break' : 'Start break'}
                    variant="secondary"
                    loading={event.isPending && event.variables?.kind !== 'check_in'}
                    icon={<Coffee color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />}
                    onPress={() => record(onBreak ? 'break_end' : 'break_start')}
                  />
                  {event.error ? (
                    <Text variant="caption" tone="danger">
                      {(event.error as Error).message}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Button label="Open job details" variant="ghost" onPress={() => router.push(`/assignment/${b.id}`)} />
              <ListRow icon={AlertTriangle} title="Report a problem" subtitle="Accident, breakdown or customer issue" onPress={() => router.push('/incident')} />
              {b.status === 'arriving' || live ? <SosButton bookingId={b.id} /> : null}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxxl },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  bodySplit: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0 },
  timer: { alignItems: 'center', gap: 4 },
  time: { fontFamily: 'Manrope_700Bold', letterSpacing: -1, color: colors.text, fontVariant: ['tabular-nums'] },
});
