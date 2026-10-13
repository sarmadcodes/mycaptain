import { router, useLocalSearchParams } from 'expo-router';
import { Building2, CheckCircle2, ClipboardList } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  DetailRow,
  EmptyView,
  ErrorView,
  Header,
  LoadingView,
  Screen,
  Section,
  Segmented,
  SelectCard,
  Text,
  TextField,
} from '@/components/ui';
import { useAssignCompany, useBooking, useBookings, useCompanies, useTransition } from '@/features/api';
import { bookingTitle, statusInfo, whenText } from '@/features/booking/labels';
import { formatPKR } from '@/features/booking/pricing';
import { useResponsive } from '@/lib/use-responsive';
import { errorMessage } from '@/services/api/client';
import { useWatchBooking } from '@/services/socket';
import { colors, space } from '@/theme';
import type { ApiBooking, BookingStatus, Service } from '@/types/api';

type Tab = 'payment' | 'assign' | 'assigned';
const TAB_STATUS: Record<Tab, BookingStatus[]> = {
  payment: ['pending_payment'],
  assign: ['assigning'],
  assigned: ['confirmed', 'arriving', 'on_duty'],
};

export function AdminDispatch() {
  const r = useResponsive();
  const [tab, setTab] = useState<Tab>('assign');
  const { data, isLoading, error, refetch, isRefetching } = useBookings(TAB_STATUS[tab]);
  const w = r.tablet ? r.columnWidth(2, space.md) : '100%';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[r.content, styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}>
        <View style={{ gap: 4 }}>
          <Text variant="title">Dispatch</Text>
          <Text tone="muted">Confirm payments and hand bookings to partner companies</Text>
        </View>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: 'Payment', value: 'payment' },
            { label: 'To assign', value: 'assign' },
            { label: 'Assigned', value: 'assigned' },
          ]}
        />
        {isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : !data?.items.length ? (
          <EmptyView icon={ClipboardList} title="Nothing waiting" body="New bookings appear here live." />
        ) : (
          <View style={styles.grid}>
            {data.items.map((b) => (
              <View key={b.id} style={{ width: w }}>
                <RequestCard b={b} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({ b }: { b: ApiBooking }) {
  const s = statusInfo[b.status];
  return (
    <Pressable onPress={() => router.push(`/dispatch/${b.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.between}>
            <Badge label={s.label} tone={s.tone} />
            <Text variant="caption" tone="muted">
              {b.code}
            </Text>
          </View>
          <Text variant="heading">{bookingTitle(b)}</Text>
          <Text variant="label" tone="muted">
            {whenText(b.startAt)}, {b.location.address}
          </Text>
          <View style={styles.between}>
            <Text variant="label">{typeof b.customer === 'object' ? b.customer.name : ''}</Text>
            <Text variant="label">{formatPKR(b.price.total)}</Text>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

// Which company service a booking needs.
const needs = (s: Service) => (s === 'driver' ? ['drivers'] : s === 'rental' ? ['rentals'] : s === 'guard' ? ['guards'] : ['armed', 'teams']);

export function DispatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useBooking(id);
  useWatchBooking(id);
  const companies = useCompanies('approved');
  const assign = useAssignCompany(id);
  const transition = useTransition(id);
  const [pick, setPick] = useState<string>();
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string>();

  if (isLoading) return <Screen header={<Header />}><LoadingView /></Screen>;
  if (error || !data) return <Screen header={<Header />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const { booking: b, next } = data;
  const company = typeof b.company === 'object' ? b.company : undefined;
  const eligible = (companies.data?.items ?? []).filter((c) => needs(b.service).some((n) => c.services.includes(n)));

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(undefined);
    try {
      await fn();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  let footer = null;
  if (b.status === 'pending_payment') {
    footer = (
      <Button label="Confirm payment received" loading={transition.isPending} onPress={() => run(() => transition.mutateAsync({ to: 'paid' }))} />
    );
  } else if (b.status === 'assigning') {
    footer = (
      <Button
        label={company ? 'Reassign company' : 'Assign to company'}
        disabled={!pick}
        loading={assign.isPending}
        onPress={() => pick && run(() => assign.mutateAsync(pick))}
      />
    );
  }

  return (
    <Screen header={<Header title={b.code} />} footer={footer}>
      <View style={{ gap: space.xl }}>
        <Badge label={statusInfo[b.status].label} tone={statusInfo[b.status].tone} />
        <Card style={{ gap: 0 }}>
          <DetailRow label="Service" value={bookingTitle(b)} />
          <DetailRow label="Customer" value={typeof b.customer === 'object' ? b.customer.name : '-'} />
          <DetailRow label="Starts" value={whenText(b.startAt)} />
          <DetailRow label="Location" value={b.location.address} />
          {b.vehicle ? <DetailRow label="Vehicle" value={`${b.vehicle.makeModel ?? b.vehicle.class}, ${b.vehicle.transmission}`} /> : null}
          {typeof b.car === 'object' && b.car ? <DetailRow label="Car" value={b.car.name} /> : null}
          {b.personnel > 1 || b.service === 'team' ? <DetailRow label="Personnel" value={String(b.service === 'team' ? b.personnel + 1 : b.personnel)} /> : null}
          {company ? <DetailRow label="Company" value={company.tradingName || company.legalName} /> : null}
          {b.staff.length ? <DetailRow label="Staff" value={b.staff.map((s) => s.name).join(', ')} /> : null}
          <DetailRow label="Total" value={formatPKR(b.price.total)} strong />
        </Card>

        {b.status === 'assigning' && company ? (
          <Card tinted style={styles.done}>
            <CheckCircle2 color={colors.green} size={22} strokeWidth={1.75} />
            <Text variant="heading" style={{ flex: 1 }}>
              With {company.tradingName || company.legalName}. Waiting for them to assign staff.
            </Text>
          </Card>
        ) : null}

        {b.status === 'assigning' ? (
          <Section title="Partner companies">
            {companies.isLoading ? (
              <LoadingView />
            ) : eligible.length ? (
              eligible.map((c) => (
                <SelectCard
                  key={c.id}
                  icon={Building2}
                  title={c.tradingName || c.legalName}
                  subtitle={`${c.city}, ${c.services.join(', ')}`}
                  selected={pick === c.id}
                  onPress={() => setPick(c.id)}
                />
              ))
            ) : (
              <Text tone="muted">No approved company offers this service yet.</Text>
            )}
          </Section>
        ) : null}

        {next.includes('cancelled') ? (
          <Section title="Cancel booking">
            <TextField label="Reason" value={note} onChangeText={setNote} placeholder="Shared with the customer" />
            <Button
              label="Cancel booking"
              variant="secondary"
              disabled={note.trim().length < 3}
              onPress={() => run(() => transition.mutateAsync({ to: 'cancelled', note: note.trim() }))}
            />
          </Section>
        ) : null}

        {actionError ? (
          <Text variant="caption" tone="danger">
            {actionError}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.xl, paddingBottom: space.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  done: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
