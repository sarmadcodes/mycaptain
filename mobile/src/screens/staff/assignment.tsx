import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle, Navigation } from 'lucide-react-native';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { Badge, Button, Card, DetailRow, ErrorView, Header, LoadingView, Screen, Section, Text } from '@/components/ui';
import { useBooking } from '@/features/api';
import { durationText, serviceName, statusInfo, whenText } from '@/features/booking/labels';
import { useWatchBooking } from '@/services/socket';
import { useAuth } from '@/stores/auth';
import { colors, iconSize, iconStroke, space } from '@/theme';

import { DutyControls } from './duty-controls';

export function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guard = useAuth((s) => s.user?.role === 'guard');
  const { data, isLoading, error, refetch } = useBooking(id);
  useWatchBooking(id);

  if (isLoading) return <Screen header={<Header />}><LoadingView /></Screen>;
  if (error || !data) return <Screen header={<Header />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const { booking: b, next } = data;
  const customer = typeof b.customer === 'object' ? b.customer.name : 'Customer';

  const openMaps = () => {
    const q = encodeURIComponent(b.location.address);
    Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <Screen header={<Header title={b.code} />} footer={<DutyControls booking={b} next={next} guard={guard} />}>
      <View style={styles.stack}>
        <Badge label={statusInfo[b.status].label} tone={statusInfo[b.status].tone} />
        <LiveMap height={180} target={KARACHI} />
        <Card style={{ gap: 0 }}>
          <DetailRow label="When" value={whenText(b.startAt)} />
          <DetailRow label="Service" value={`${serviceName[b.service]}, ${durationText(b)}`} />
          <DetailRow label={guard ? 'Post' : 'Pickup'} value={b.location.address} />
          {b.location.point ? <DetailRow label="Point" value={b.location.point} /> : null}
          {b.vehicle ? (
            <DetailRow label="Vehicle" value={`${b.vehicle.makeModel ?? b.vehicle.class}, ${b.vehicle.transmission}`} />
          ) : null}
          {typeof b.car === 'object' && b.car ? <DetailRow label="Car" value={b.car.name} /> : null}
          {b.staff.length > 1 ? <DetailRow label="Team" value={b.staff.map((s) => s.name).join(', ')} /> : null}
          <DetailRow label="Customer" value={customer} />
        </Card>
        {b.instructions ? (
          <Section title="Instructions">
            <Text tone="muted">{b.instructions}</Text>
          </Section>
        ) : null}
        <View style={{ gap: space.sm }}>
          <Button
            label={guard ? 'Navigate to post' : 'Navigate to pickup'}
            variant="secondary"
            icon={<Navigation color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />}
            onPress={openMaps}
          />
          <Button
            label="Message customer"
            variant="secondary"
            icon={<MessageCircle color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />}
            onPress={() => router.push(`/messages/${b.id}`)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.xl },
});
