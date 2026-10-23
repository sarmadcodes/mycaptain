import { router } from 'expo-router';
import { CheckCircle2, CreditCard, Landmark, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, DetailRow, ErrorView, Header, LoadingView, Screen, SelectCard, Text } from '@/components/ui';
import { useCreateBooking, useQuote } from '@/features/api';
import { usePay } from '@/features/ops';
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
  const pay = usePay();
  const [booking, setBooking] = useState<ApiBooking>();
  const [reference, setReference] = useState<string>();
  // Created but not yet paid (e.g. the payment step failed): retry pays the same booking.
  const [pending, setPending] = useState<ApiBooking>();

  // Demo checkout: creates the booking, then pays it instantly. No money moves.
  const confirm = async () => {
    const created = pending ?? (await create.mutateAsync(input)).booking;
    setPending(created);
    const paid = await pay.mutateAsync({ bookingId: created.id, method });
    setReference(paid.payment.reference);
    setBooking(paid.booking);
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
          <Text variant="title">Payment successful</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            {booking.code} is paid. We are assigning your staff and will update you here live.
          </Text>
          <Card style={styles.receipt}>
            <DetailRow label="Booking" value={booking.code} />
            {reference ? <DetailRow label="Receipt" value={reference} /> : null}
            <DetailRow label="Total" value={formatPKR(booking.price.total)} strong />
            <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
              Demo payment: no money was charged.
            </Text>
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
          {create.error || pay.error ? (
            <Text variant="caption" tone="danger">
              {errorMessage(create.error ?? pay.error)}
            </Text>
          ) : null}
          <Button
            label={price ? `Confirm and pay ${formatPKR(price.total)}` : 'Confirm booking'}
            disabled={!price}
            loading={create.isPending || pay.isPending}
            onPress={() => confirm().catch(() => {})}
          />
        </>
      }>
      <View style={styles.intro}>
        <Text variant="title">How would you like to pay?</Text>
        <Text tone="muted">Every payment stays inside My Captain.</Text>
        <View style={styles.demo}>
          <Text variant="label" style={{ color: colors.blue }}>
            Demo mode: payments complete instantly and nothing is charged.
          </Text>
        </View>
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
  demo: { backgroundColor: colors.paleBlue, borderRadius: 12, padding: space.md, marginTop: space.sm },
  options: { gap: space.md },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  receipt: { alignSelf: 'stretch', gap: 0, marginTop: space.lg },
});
