import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailRow, Header, Screen, Text } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { findStaff } from '@/lib/mock-data';
import { colors, iconStroke, space } from '@/theme';

const kindLabel = { driver: 'Driver', guard: 'Security guard', gunman: 'Armed gunman' };

export function StaffProfileStep() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const set = useBookingDraft((s) => s.set);
  const staff = findStaff(driverId);

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
          label={`Select ${first}`}
          onPress={() => {
            set({ staffId: staff.id });
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
            Identity and background verified
          </Text>
        </View>
      </View>

      <Card style={{ gap: 0 }}>
        <DetailRow label="Role" value={kindLabel[staff.kind]} />
        <DetailRow label="Experience" value={`${staff.years} years`} />
        <DetailRow label="Speciality" value={staff.specialty} />
        <DetailRow label="Languages" value={staff.languages} />
        <DetailRow label="Rating" value={`${staff.rating.toFixed(1)} out of 5`} />
        <DetailRow label="Next available" value={`In ${staff.eta}`} />
      </Card>

      <Text variant="caption" tone="muted" style={{ marginTop: space.lg }}>
        If {first} becomes unavailable, My Captain assigns a captain with matching experience.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: space.sm, marginBottom: space.xxl },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
