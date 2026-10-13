import { router } from 'expo-router';
import { CheckCircle2, CreditCard, Landmark, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, DetailRow, ErrorView, Header, LoadingView, Screen, SelectCard, Text } from '@/components/ui';
import { useCreateBooking, useQuote } from '@/features/api';
import { formatPKR } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { toInput } from '@/features/booking/to-input';
import { errorMessage } from '@/services/api/client';
import { colors, space } from '@/theme';
import type { ApiBooking } from '@/types/api';

type Method = 'card' | 'wallet' | 'bank';

export function PaymentStep() {
  const draft = useBookingDraft();
  const input = toInput(draft);
  const quote = useQuote(input);
  const create = useCreateBooking();
  const [method, setMethod] = useState<Method>('card');
  const [booking, setBooking] = useState<ApiBooking>();

  // TODO(phase 4): open the payment provider's checkout for `method`, then create on success.
  const confirm = async () => {
    const { booking: created } = await create.mutateAsync(input);
    setBooking(created);
  };

  if (booking) {
    return (
      <Screen
        scroll={false}
        footer={
          <>
            <Button label="Track booking" onPress={() => router.replace(`/booking/${booking.id}`)} />
            <Button label="Back to home" variant="ghost" onPress={() => router.replace('/home')} />
          </>
        }>
        <View style={styles.done}>
          <CheckCircle2 color={colors.green} size={56} strokeWidth={1.5} />
          <Text variant="title">Booking received</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            {booking.code} is with our team. We confirm payment, assign your captain and update you here live.
          </Text>
          <Card style={styles.receipt}>
            <DetailRow label="Booking" value={booking.code} />
            <DetailRow label="Total" value={formatPKR(booking.price.total)} strong />
          </Card>
        </View>
      </Screen>
    );
  }

  const price = quote.data?.price;
  return (
    <Screen
      header={<Header title="Payment" />}
      footer={
        <>
          {create.error ? (
            <Text variant="caption" tone="danger">
              {errorMessage(create.error)}
            </Text>
          ) : null}
          <Button
            label={price ? `Confirm and pay ${formatPKR(price.total)}` : 'Confirm booking'}
            disabled={!price}
            loading={create.isPending}
            onPress={() => confirm().catch(() => {})}
          />
        </>
      }>
      <View style={styles.intro}>
        <Text variant="title">How would you like to pay?</Text>
        <Text tone="muted">Every payment stays inside My Captain.</Text>
      </View>
      {quote.isLoading ? <LoadingView label="Checking price" /> : quote.error ? <ErrorView error={quote.error} onRetry={quote.refetch} /> : null}
      <View style={styles.options}>
        <SelectCard
          icon={CreditCard}
          title="Debit or credit card"
          subtitle="Visa, Mastercard, UnionPay"
          selected={method === 'card'}
          onPress={() => setMethod('card')}
        />
        <SelectCard
          icon={Smartphone}
          title="Mobile wallet"
          subtitle="JazzCash or Easypaisa"
          selected={method === 'wallet'}
          onPress={() => setMethod('wallet')}
        />
        <SelectCard icon={Landmark} title="Bank transfer" subtitle="Raast or IBFT" selected={method === 'bank'} onPress={() => setMethod('bank')} />
      </View>
      <Text variant="caption" tone="muted" style={{ marginTop: space.xl }}>
        Receipts are saved in Bookings. Staff never collect cash.
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
