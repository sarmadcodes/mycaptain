import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailRow, Header, Screen, Text } from '@/components/ui';
import { durationLabel, formatPKR, quote } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { findStaff } from '@/lib/mock-data';
import { colors, space } from '@/theme';
import { formatDate, formatTime } from '@/utils/datetime';

const serviceName = { driver: 'Driver', guard: 'Security guard', gunman: 'Armed gunman', team: 'Security team' };
const vehicleName = { small: 'Small car', sedan: 'Sedan', suv: 'SUV', luxury: 'Luxury' };

export function ReviewStep() {
  const d = useBookingDraft();
  const staff = findStaff(d.staffId);
  const price = quote(d);
  const scheduled = d.start === 'later' || d.plan === 'monthly' || d.plan === 'contract';
  const when = scheduled ? `${formatDate(d.date)}, ${formatTime(d.time)}` : 'Now, within 30 minutes';

  return (
    <Screen
      header={<Header title="Review booking" />}
      footer={<Button label="Continue to payment" onPress={() => router.push('/book/payment')} />}>
      {staff ? (
        <Card style={styles.staff}>
          <Avatar name={staff.name} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">{staff.name}</Text>
            <Text variant="label" tone="muted">
              Requested {d.service === 'driver' ? 'driver' : 'lead'}
            </Text>
          </View>
        </Card>
      ) : null}

      <Card style={styles.block}>
        <DetailRow label="Service" value={d.service === 'driver' || d.personnel === 1 ? serviceName[d.service] : `${serviceName[d.service]}, ${d.personnel} people`} />
        <DetailRow label="Starts" value={when} />
        <DetailRow label="Duration" value={durationLabel(d)} />
        {d.service === 'driver' ? (
          <>
            <DetailRow
              label="Vehicle"
              value={[d.vehicle.makeModel || vehicleName[d.vehicle.class], d.vehicle.transmission === 'automatic' ? 'Automatic' : 'Manual'].join(', ')}
            />
            <DetailRow label="Pickup" value={d.location} />
          </>
        ) : (
          <>
            <DetailRow label="Address" value={d.post.address} />
            {d.post.point ? <DetailRow label="Post" value={d.post.point} /> : null}
          </>
        )}
      </Card>

      <Card style={styles.block}>
        <DetailRow label="Service price" value={formatPKR(price.subtotal)} />
        <DetailRow label="Platform fee and taxes" value={formatPKR(price.fee)} />
        <View style={styles.divider} />
        <DetailRow label="Total" value={formatPKR(price.total)} strong />
        {price.perPeriod ? (
          <Text variant="caption" tone="muted">
            Billed monthly: {formatPKR(price.perPeriod)}
          </Text>
        ) : null}
      </Card>

      <Text variant="caption" tone="muted" style={{ marginTop: space.lg }}>
        Prices are examples until live rate cards are connected. All payments happen in the app; staff never collect cash.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  staff: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  block: { gap: 0, marginBottom: space.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.sm },
});
