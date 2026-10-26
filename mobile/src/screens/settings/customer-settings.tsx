import { router } from 'expo-router';
import { CreditCard, Plus, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, EmptyView, ErrorView, Header, LoadingView, Screen, Text, TextField } from '@/components/ui';
import { useBookings } from '@/features/api';
import { useMe, useUpdateMe } from '@/features/ops';
import { bookingTitle, isLive, statusInfo } from '@/features/booking/labels';
import { SwitchRow } from '@/components/ui/switch-row';
import { formatPKR } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { api, errorMessage } from '@/services/api/client';
import { useAuth } from '@/stores/auth';
import type { ApiUser } from '@/types/api';
import { colors, space } from '@/theme';

export function PersonalDetails() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);
  if (!user) return null;

  const save = async () => {
    setError(undefined);
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: ApiUser }>('/auth/me', { name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) });
      await setUser({ ...user, ...data.user, company: user.company });
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<Header title="Personal details" />}
      footer={<Button label={saved ? 'Saved' : 'Save changes'} loading={saving} onPress={save} />}>
      <View style={styles.form}>
        <TextField label="Full name" value={name} onChangeText={(t) => (setName(t), setSaved(false))} autoCapitalize="words" />
        <TextField label="Mobile number" value={user.phone} editable={false} hint="To change your number, contact support." />
        <TextField
          label="Email"
          value={email}
          onChangeText={(t) => (setEmail(t), setSaved(false))}
          keyboardType="email-address"
          autoCapitalize="none"
          hint="Receipts and invoices are sent here."
        />
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

export function PaymentMethods() {
  return (
    <Screen header={<Header title="Payment methods" />}>
      <View style={styles.form}>
        <Card style={styles.method}>
          <CreditCard color={colors.blue} size={22} strokeWidth={1.75} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Visa ending 4821</Text>
            <Text variant="label" tone="muted">
              Expires 08/28
            </Text>
          </View>
          <Badge label="Default" tone="blue" />
        </Card>
        <Card style={styles.method}>
          <Smartphone color={colors.blue} size={22} strokeWidth={1.75} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">JazzCash</Text>
            <Text variant="label" tone="muted">
              0300 ••• 4567
            </Text>
          </View>
        </Card>
        <Button
          label="Add payment method"
          variant="secondary"
          icon={<Plus color={colors.text} size={20} strokeWidth={1.75} />}
          onPress={() => router.push('/settings/add-payment')}
        />
        <Text variant="caption" tone="muted">
          Card details are handled by the payment provider. My Captain never stores your full card number.
        </Text>
      </View>
    </Screen>
  );
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Receipts for every booking that has been paid.
export function Invoices() {
  const { data, isLoading, error, refetch } = useBookings();
  const paid = (data?.items ?? []).filter((b) => b.paidAt);
  return (
    <Screen header={<Header title="Invoices and receipts" />}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : !paid.length ? (
        <EmptyView title="No receipts yet" body="Every paid booking gets a receipt here." />
      ) : (
        <View style={{ gap: space.md }}>
          {paid.map((b) => (
            <Card key={b.id} style={styles.invoice}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="heading">{formatPKR(b.price.total)}</Text>
                <Text variant="label" tone="muted">
                  {b.code}, {bookingTitle(b)}
                </Text>
                <Text variant="caption" tone="faint">
                  Paid {day(b.paidAt!)}, includes {formatPKR(b.price.fee)} service fee
                </Text>
              </View>
              <Badge label={b.status === 'cancelled' ? 'Cancelled' : 'Paid'} tone={b.status === 'cancelled' ? 'amber' : 'green'} />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const addMonths = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
};

// Monthly plans and long-term contracts.
export function Contracts() {
  const { data, isLoading, error, refetch } = useBookings();
  const contracts = (data?.items ?? []).filter((b) => b.plan === 'monthly' || b.plan === 'contract');
  return (
    <Screen header={<Header title="Contracts" />}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : !contracts.length ? (
        <EmptyView
          title="No contracts"
          body="Monthly plans and 6 or 12-month contracts appear here."
          action={{ label: 'Start a contract', onPress: () => router.push('/book/schedule') }}
        />
      ) : (
        <View style={styles.form}>
          {contracts.map((b) => {
            const months = b.plan === 'monthly' ? 1 : (b.contractMonths ?? 6);
            const active = isLive(b.status);
            return (
              <Card key={b.id} style={{ gap: space.md }}>
                <View style={styles.between}>
                  <Badge label={statusInfo[b.status].label} tone={active ? 'green' : statusInfo[b.status].tone} />
                  <Text variant="caption" tone="muted">
                    {b.code}
                  </Text>
                </View>
                <Text variant="title">{bookingTitle(b)}</Text>
                <View>
                  {b.staff.length ? <DetailRow label="Regular staff" value={b.staff.map((x) => x.name).join(', ')} /> : null}
                  <DetailRow label="Starts" value={day(b.startAt)} />
                  <DetailRow label="Ends" value={day(addMonths(b.startAt, months))} />
                  <DetailRow label="Location" value={b.location.address} />
                  <DetailRow label="Total" value={formatPKR(b.price.total)} strong />
                </View>
                <Button
                  label="Renew or change terms"
                  variant="secondary"
                  onPress={() => {
                    // Pre-fill the same service and staff; the customer adjusts it on the schedule screen.
                    useBookingDraft.getState().reset(b.service);
                    useBookingDraft.getState().set({
                      plan: b.plan,
                      start: 'later',
                      staffId: b.staff[0]?.id,
                      ...(b.vehicle
                        ? { vehicle: { class: b.vehicle.class, makeModel: b.vehicle.makeModel ?? '', engine: '', transmission: b.vehicle.transmission, notes: b.vehicle.notes ?? '' } }
                        : {}),
                    });
                    router.push('/book/schedule');
                  }}
                />
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

export function NotificationSettings() {
  const me = useMe();
  const update = useUpdateMe();
  const enabled = me.data?.user.pushEnabled ?? true;
  return (
    <Screen header={<Header title="Notifications" />}>
      <SwitchRow
        title="Push notifications"
        subtitle="Staff assigned, on the way, duty started and finished, messages, refunds and case updates"
        value={enabled}
        onChange={(v) => update.mutate({ pushEnabled: v })}
      />
      <Text variant="caption" tone="muted" style={{ marginTop: space.md }}>
        Emergency and safety alerts are always shown in the app. You can also turn notifications off in your phone settings.
      </Text>
      {update.error ? (
        <Text variant="caption" tone="danger">
          {errorMessage(update.error)}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  method: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  invoice: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
