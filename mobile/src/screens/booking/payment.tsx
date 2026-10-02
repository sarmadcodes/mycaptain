import { router } from 'expo-router';
import { CheckCircle2, CreditCard, Landmark, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, DetailRow, Header, Screen, SelectCard, Text } from '@/components/ui';
import { formatPKR, quote } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { colors, space } from '@/theme';

type Method = 'card' | 'wallet' | 'bank';

export function PaymentStep() {
  const draft = useBookingDraft();
  const price = quote(draft);
  const [method, setMethod] = useState<Method>('card');
  const [state, setState] = useState<'idle' | 'paying' | 'done'>('idle');

  // TODO(payments): hand off to the chosen payment provider's checkout.
  const pay = async () => {
    setState('paying');
    await new Promise((r) => setTimeout(r, 1400));
    setState('done');
  };

  if (state === 'done') {
    return (
      <Screen
        scroll={false}
        footer={
          <>
            <Button label="Track booking" onPress={() => router.replace('/booking/MC-2048')} />
            <Button label="Back to home" variant="ghost" onPress={() => router.replace('/home')} />
          </>
        }>
        <View style={styles.done}>
          <CheckCircle2 color={colors.green} size={56} strokeWidth={1.5} />
          <Text variant="title">Payment successful</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            Booking MC-2051 is confirmed. We are assigning your captain and will notify you shortly.
          </Text>
          <Card style={styles.receipt}>
            <DetailRow label="Amount paid" value={formatPKR(price.total)} />
            <DetailRow label="Receipt" value="In Bookings" />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title="Payment" />}
      footer={<Button label={`Pay ${formatPKR(price.total)}`} loading={state === 'paying'} onPress={pay} />}>
      <View style={styles.intro}>
        <Text variant="title">How would you like to pay?</Text>
        <Text tone="muted">Every payment stays inside My Captain.</Text>
      </View>
      <View style={styles.options}>
        <SelectCard icon={CreditCard} title="Debit or credit card" subtitle="Visa, Mastercard, UnionPay" selected={method === 'card'} onPress={() => setMethod('card')} />
        <SelectCard icon={Smartphone} title="Mobile wallet" subtitle="JazzCash or Easypaisa" selected={method === 'wallet'} onPress={() => setMethod('wallet')} />
        <SelectCard icon={Landmark} title="Bank transfer" subtitle="Raast or IBFT" selected={method === 'bank'} onPress={() => setMethod('bank')} />
      </View>
      <Text variant="caption" tone="muted" style={{ marginTop: space.xl }}>
        Receipts and invoices are saved in Bookings. Extensions and renewals use the same checkout.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  options: { gap: space.md },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  receipt: { alignSelf: 'stretch', gap: 0, marginTop: space.lg },
});
