import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailRow, ErrorView, Header, LoadingView, Screen, Text } from '@/components/ui';
import { useStaffProfiles } from '@/features/api';
import { useBookingDraft } from '@/features/booking/store';
import { colors, iconStroke, space } from '@/theme';

const kindLabel = { driver: 'Driver', guard: 'Security guard (bouncer)', gunman: 'Armed gunman' };

export function StaffProfileStep() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const service = useBookingDraft((s) => s.service);
  const set = useBookingDraft((s) => s.set);
  const kind = service === 'driver' || service === 'rental' ? 'driver' : service === 'guard' ? 'guard' : 'gunman';
  const { data, isLoading, error, refetch } = useStaffProfiles(kind);
  const staff = data?.staff.find((s) => s.id === driverId);

  if (isLoading) return <Screen header={<Header />}><LoadingView /></Screen>;
  if (error) return <Screen header={<Header />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  if (!staff) {
    return (
      <Screen header={<Header />}>
        <Text tone="muted">This profile is no longer available.</Text>
      </Screen>
    );
  }

  const first = staff.name.split(' ')[0];
  return (
    <Screen
      header={<Header />}
      footer={
        <Button
          label={`Request ${first}`}
          onPress={() => {
            set({ staffId: staff.id, staffName: staff.name });
            router.push('/book/schedule');
          }}
        />
      }>
      <View style={styles.head}>
        <Avatar name={staff.name} size={88} />
        <Text variant="title">{staff.name}</Text>
        <View style={styles.verified}>
          <BadgeCheck color={colors.green} size={16} strokeWidth={iconStroke} />
          <Text variant="label" style={{ color: colors.green }}>
            Identity and documents verified
          </Text>
        </View>
      </View>
      <Card style={{ gap: 0 }}>
        <DetailRow label="Role" value={kindLabel[staff.staffKind]} />
        <DetailRow label="Company" value={staff.companyName ?? 'My Captain partner'} />
      </Card>
      <Text variant="caption" tone="muted" style={{ marginTop: space.lg }}>
        If {first} is not available at your time, My Captain assigns a captain with matching experience.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: space.sm, marginBottom: space.xxl },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
