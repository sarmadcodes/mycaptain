import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Check, MessageCircle, MessageSquareWarning, Phone, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { RateBooking } from '@/components/rate-booking';
import { SosButton } from '@/components/sos-button';
import { Avatar, Badge, Button, Card, DetailRow, ErrorView, Header, ListRow, LoadingView, Screen, Section, Text, TextField } from '@/components/ui';
import { useBooking, useTransition } from '@/features/api';
import { durationText, serviceName, statusInfo, whenText } from '@/features/booking/labels';
import { formatPKR } from '@/features/booking/pricing';
import { SUPPORT_PHONE } from '@/lib/config';
import { errorMessage } from '@/services/api/client';
import { useWatchBooking } from '@/services/socket';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';
import type { ApiBooking, BookingStatus } from '@/types/api';

const STEPS: BookingStatus[] = ['pending_payment', 'assigning', 'confirmed', 'arriving', 'on_duty', 'completed'];
const fmt = (min: number) => `${Math.floor(min / 60)}h ${String(Math.max(0, min % 60)).padStart(2, '0')}m`;

export function LiveDuty() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useBooking(id);
  useWatchBooking(id);

  if (isLoading) return <Screen header={<Header />}><LoadingView /></Screen>;
  if (error || !data) return <Screen header={<Header />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  return <DutyBody booking={data.booking} next={data.next} />;
}

function DutyBody({ booking: b, next }: { booking: ApiBooking; next: BookingStatus[] }) {
  const s = statusInfo[b.status];
  const transition = useTransition(b.id);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string>();
  const staff = b.staff[0];
  const live = b.status === 'on_duty';
  const isDriver = b.service === 'driver' || b.service === 'rental';

  // Duty timer from the on_duty event, ticking each minute.
  const startedAt = [...b.history].reverse().find((h) => h.status === 'on_duty')?.at;
  const [, tick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, [live]);
  const elapsed = startedAt ? dayjs().diff(dayjs(startedAt), 'minute') : 0;
  const total = (b.price.billableHours || 1) * 60;
  const progress = Math.min(1, elapsed / total);

  // Live positions sent by the staff phones; the map follows the first staff member.
  const pos = b.locations?.[0];
  const here = pos ? { latitude: pos.lat, longitude: pos.lng } : undefined;
  const target = b.location.lat != null && b.location.lng != null ? { latitude: b.location.lat, longitude: b.location.lng } : undefined;
  const tracking = b.status === 'arriving' || live;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!tracking) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [tracking]);
  const seen = pos ? Math.max(0, Math.round((now - +new Date(pos.at)) / 60_000)) : null;
  const breaks = (b.events ?? []).filter((e) => e.kind === 'break_start' || e.kind === 'break_end');
  const onBreak = live && breaks.at(-1)?.kind === 'break_start';

  const act = async (to: BookingStatus, note?: string) => {
    setActionError(undefined);
    try {
      await transition.mutateAsync({ to, note });
      setCancelling(false);
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  const caseLink = (type: string) => router.push({ pathname: '/case/new', params: { type, bookingId: b.id } });
  const stepIndex = b.status === 'paid' ? 1 : STEPS.indexOf(b.status === 'closed' ? 'completed' : b.status);

  return (
    <Screen header={<Header title={b.code} />}>
      <View style={styles.stack}>
        <LiveMap height={220} target={target ?? here ?? KARACHI} staff={tracking ? here : undefined} geofenceMeters={isDriver || !target ? undefined : 60} />
        {tracking ? (
          <Text variant="caption" tone="muted">
            {here
              ? seen! <= 1
                ? 'Live location, updated just now.'
                : `Last location ${seen} min ago. It updates as they move.`
              : 'Waiting for their location. It appears once they share it.'}
          </Text>
        ) : null}

        <Card style={{ gap: space.lg }}>
          <View style={styles.row}>
            <Avatar name={staff?.name ?? 'My Captain'} size={52} />
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Badge label={onBreak ? 'On a short break' : s.label} tone={onBreak ? 'amber' : s.tone} />
              <Text variant="heading">{staff?.name ?? s.customer}</Text>
              <Text variant="label" tone="muted">
                {serviceName[b.service]}, {durationText(b)}
                {b.staff.length > 1 ? `, team of ${b.staff.length}` : ''}
              </Text>
            </View>
          </View>

          {live ? (
            <View style={{ gap: space.sm }}>
              <View style={styles.between}>
                <Text variant="label" tone="muted">
                  {fmt(elapsed)} of {durationText(b)}
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

          {staff ? (
            <View style={styles.actions}>
              <Action icon={MessageCircle} label="Message" onPress={() => router.push(`/chat/${b.id}`)} />
              <Action icon={Phone} label="Call support" onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
            </View>
          ) : null}
        </Card>

        {b.status !== 'cancelled' ? (
          <Section title="Progress">
            <View style={styles.steps}>
              {STEPS.map((st, i) => {
                const done = i < stepIndex || b.status === 'closed';
                const current = i === stepIndex && b.status !== 'closed';
                return (
                  <View key={st} style={styles.step}>
                    <View style={[styles.dot, done && styles.dotDone, current && styles.dotNow]}>
                      {done ? <Check color={colors.onPrimary} size={12} strokeWidth={3} /> : null}
                    </View>
                    <Text variant="label" tone={done || current ? 'default' : 'faint'}>
                      {st === 'pending_payment' ? 'Requested' : statusInfo[st].label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        ) : (
          <Card style={{ gap: 4 }}>
            <Text variant="heading">Booking cancelled</Text>
            {b.cancelReason ? <Text tone="muted">{b.cancelReason}</Text> : null}
          </Card>
        )}

        <Card style={{ gap: 0 }}>
          <DetailRow label="Starts" value={whenText(b.startAt)} />
          <DetailRow label={isDriver ? 'Pickup' : 'Location'} value={b.location.address} />
          {b.location.point ? <DetailRow label="Post" value={b.location.point} /> : null}
          {typeof b.car === 'object' && b.car ? <DetailRow label="Car" value={b.car.name} /> : null}
          {typeof b.company === 'object' && b.company ? <DetailRow label="Company" value={b.company.tradingName || b.company.legalName} /> : null}
          <DetailRow label="Total" value={formatPKR(b.price.total)} strong />
        </Card>

        {actionError ? (
          <Text variant="caption" tone="danger">
            {actionError}
          </Text>
        ) : null}

        {b.status === 'completed' || b.status === 'closed' ? <RateBooking booking={b} /> : null}

        {tracking ? (
          <Section title="Emergency">
            <SosButton bookingId={b.id} />
          </Section>
        ) : null}

        {next.includes('closed') ? (
          <Button label="Confirm duty completed" loading={transition.isPending} onPress={() => act('closed')} />
        ) : null}

        {next.includes('cancelled') ? (
          cancelling ? (
            <Card style={{ gap: space.md }}>
              <TextField label="Why are you cancelling?" value={reason} onChangeText={setReason} placeholder="Plans changed" />
              <View style={styles.actions}>
                <Button label="Keep booking" variant="secondary" style={{ flex: 1 }} onPress={() => setCancelling(false)} />
                <Button
                  label="Cancel booking"
                  style={{ flex: 1, backgroundColor: colors.red }}
                  disabled={reason.trim().length < 3}
                  loading={transition.isPending}
                  onPress={() => act('cancelled', reason.trim())}
                />
              </View>
            </Card>
          ) : (
            <Button label="Cancel booking" variant="ghost" onPress={() => setCancelling(true)} />
          )
        ) : null}

        {staff ? (
          <Section title="Need help?">
            <View>
              <ListRow icon={RefreshCw} title="Request replacement" onPress={() => caseLink('replacement')} />
              <ListRow icon={AlertTriangle} title="Report accident" onPress={() => caseLink('accident')} />
              <ListRow icon={MessageSquareWarning} title="Make a complaint" onPress={() => caseLink('complaint')} />
            </View>
          </Section>
        ) : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.paleBlue, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blue, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: space.md, borderRadius: radius.md, backgroundColor: colors.surface },
  steps: { gap: space.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.green, borderColor: colors.green },
  dotNow: { borderColor: colors.blue, borderWidth: 6 },
});
