import { router } from 'expo-router';
import { CarFront } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailRow, ErrorView, Header, LoadingView, Screen, Text } from '@/components/ui';
import { useQuote } from '@/features/api';
import { toInput } from '@/features/booking/to-input';
import { durationLabel, formatPKR } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { colors, radius, space } from '@/theme';
import type { Service as ServiceType } from '@/types/api';
import { formatDate, formatTime } from '@/utils/datetime';

const serviceName: Record<ServiceType, string> = {
  driver: 'Driver for your car',
  rental: 'Car rental with driver',
  guard: 'Security guard (bouncer)',
  gunman: 'Armed gunman',
  team: 'Security team',
};
const vehicleName = { small: 'Small car', sedan: 'Sedan', suv: 'SUV', luxury: 'Luxury' };

export function ReviewStep() {
  const d = useBookingDraft();
  const staff = d.staffId && d.staffName ? { name: d.staffName, company: 'Requested captain' } : undefined;
  const car = d.service === 'rental' && d.carName ? { name: d.carName, company: d.carCompany ?? 'Partner fleet' } : undefined;
  // Price comes from the server, the same calculation used when the booking is created.
  const quote = useQuote(toInput(d));
  const price = quote.data?.price;
  const scheduled = d.start === 'later' || d.plan === 'monthly' || d.plan === 'contract';
  const when = scheduled ? `${formatDate(d.date)}, ${formatTime(d.time)}` : 'Now, within 30 minutes';

  const people =
    d.service === 'team'
      ? `1 armed lead, ${d.personnel} ${d.personnel === 1 ? 'guard' : 'guards'}`
      : d.service === 'guard' && d.personnel > 1
        ? `${d.personnel} guards`
        : undefined;

  return (
    <Screen
      header={<Header title="Review booking" />}
      footer={<Button label="Continue to payment" disabled={!price} onPress={() => router.push('/book/payment')} />}>
      {staff ? (
        <Card style={styles.top}>
          <Avatar name={staff.name} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="heading">{staff.name}</Text>
            <Text variant="label" tone="muted">
              {staff.company}
            </Text>
          </View>
        </Card>
      ) : null}
      {car ? (
        <Card style={styles.top}>
          <View style={styles.carIcon}>
            <CarFront color={colors.navy} size={24} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="heading">{car.name}</Text>
            <Text variant="label" tone="muted">
              {car.company}, driver included
            </Text>
          </View>
        </Card>
      ) : null}

      <Card style={styles.block}>
        <DetailRow label="Service" value={serviceName[d.service]} />
        {people ? <DetailRow label="Personnel" value={people} /> : null}
        <DetailRow label="Starts" value={when} />
        <DetailRow label="Duration" value={durationLabel(d)} />
        {d.service === 'driver' ? (
          <DetailRow
            label="Vehicle"
            value={[
              d.vehicle.makeModel || vehicleName[d.vehicle.class],
              d.vehicle.transmission === 'automatic' ? 'Automatic' : 'Manual',
            ].join(', ')}
          />
        ) : null}
        {d.service === 'driver' || d.service === 'rental' ? (
          <DetailRow label="Pickup" value={d.location} />
        ) : (
          <>
            <DetailRow label="Address" value={d.post.address} />
            {d.post.point ? <DetailRow label="Post" value={d.post.point} /> : null}
          </>
        )}
      </Card>

      {quote.isLoading ? (
        <LoadingView label="Calculating price" />
      ) : quote.error || !price ? (
        <ErrorView error={quote.error} onRetry={quote.refetch} />
      ) : (
        <Card style={styles.block}>
          <DetailRow label="Service price" value={formatPKR(price.subtotal)} />
          <DetailRow label="Platform fee and taxes" value={formatPKR(price.fee)} />
          <View style={styles.divider} />
          <DetailRow label="Total" value={formatPKR(price.total)} strong />
          {d.plan === 'contract' ? (
            <Text variant="caption" tone="muted">
              Billed monthly: {formatPKR(Math.round(price.total / d.contractMonths))}
            </Text>
          ) : null}
        </Card>
      )}

      <Text variant="caption" tone="muted" style={{ marginTop: space.lg }}>
        {d.service === 'rental' ? 'Fuel and tolls are billed at actual cost after the trip. ' : ''}
        All payments happen in the app; staff never collect cash.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  carIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { gap: 0, marginBottom: space.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.sm },
});
