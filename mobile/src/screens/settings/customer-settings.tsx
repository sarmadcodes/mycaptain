import { router } from 'expo-router';
import { CheckCircle2, CreditCard, Plus, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, Header, ListRow, Screen, Section, Text, TextField } from '@/components/ui';
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

  // TODO(backend): PATCH /me
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

const invoices = [
  { id: 'INV-1042', label: 'MC-2048, driver 4 hours', date: '4 Oct 2026', amount: 4200, status: 'Paid' },
  { id: 'INV-1037', label: '6-month driver plan, October', date: '1 Oct 2026', amount: 187200, status: 'Paid' },
  { id: 'INV-1031', label: 'MC-2031, driver 1 day', date: '24 Sep 2026', amount: 7180, status: 'Paid' },
  { id: 'INV-1022', label: 'MC-2017, armed gunman 4 hours', date: '12 Sep 2026', amount: 5040, status: 'Paid' },
];

export function Invoices() {
  return (
    <Screen header={<Header title="Invoices and receipts" />}>
      <View style={{ gap: space.md }}>
        {invoices.map((i) => (
          <Card key={i.id} style={styles.invoice}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading">{formatPKR(i.amount)}</Text>
              <Text variant="label" tone="muted">
                {i.label}
              </Text>
              <Text variant="caption" tone="faint">
                {i.id}, {i.date}
              </Text>
            </View>
            <Badge label={i.status} tone="green" />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

export function Contracts() {
  return (
    <Screen header={<Header title="Contracts" />}>
      <View style={styles.form}>
        <Card style={{ gap: space.md }}>
          <View style={styles.between}>
            <Badge label="Active" tone="green" />
            <Text variant="caption" tone="muted">
              CON-018
            </Text>
          </View>
          <Text variant="title">6-month driver plan</Text>
          <View>
            <DetailRow label="Regular captain" value="Ahmed Raza" />
            <DetailRow label="Schedule" value="Mon to Sat, 9 AM to 5 PM" />
            <DetailRow label="Started" value="1 Jul 2026" />
            <DetailRow label="Ends" value="31 Dec 2026" />
            <DetailRow label="Next invoice" value="1 Nov 2026" />
            <DetailRow label="Monthly amount" value={formatPKR(187200)} strong />
          </View>
        </Card>
        <Button
          label="Renew or change terms"
          variant="secondary"
          onPress={() => {
            // Pre-fill a driver contract for the same captain; the customer adjusts it on the schedule screen.
            useBookingDraft.getState().reset('driver');
            useBookingDraft
              .getState()
              .set({
                plan: 'contract',
                start: 'later',
                staffId: 'd1',
                vehicle: { class: 'suv', makeModel: 'Toyota Fortuner', engine: '2700+', transmission: 'automatic', notes: '' },
              });
            router.push('/book/schedule');
          }}
        />
        <Section title="Replacement history">
          <ListRow icon={CheckCircle2} title="Bilal Khan covered 2 days" subtitle="18 to 19 Sep, Ahmed on leave" />
        </Section>
      </View>
    </Screen>
  );
}

export function NotificationSettings() {
  const [prefs, setPrefs] = useState({ duty: true, arrival: true, payments: true, offers: false, sms: true });
  const toggle = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));
  return (
    <Screen header={<Header title="Notifications" />}>
      <SwitchRow title="Duty updates" subtitle="Check-ins, breaks and duty end" value={prefs.duty} onChange={toggle('duty')} />
      <SwitchRow
        title="Arrival alerts"
        subtitle="When your captain is close"
        value={prefs.arrival}
        onChange={toggle('arrival')}
      />
      <SwitchRow title="Payments and invoices" value={prefs.payments} onChange={toggle('payments')} />
      <SwitchRow title="SMS for urgent cases" value={prefs.sms} onChange={toggle('sms')} />
      <SwitchRow title="Offers and news" value={prefs.offers} onChange={toggle('offers')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  method: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  invoice: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
