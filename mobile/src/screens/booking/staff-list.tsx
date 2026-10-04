import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Header, Screen, Text } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { drivers, securityStaff, type StaffProfile } from '@/lib/mock-data';
import { colors, iconStroke, space } from '@/theme';

// Matching drivers (by vehicle class) or security personnel (by type).
export function StaffList({ kind }: { kind: 'driver' | 'security' }) {
  const draft = useBookingDraft();
  const list =
    kind === 'driver'
      ? drivers.filter((d) => d.classes?.includes(draft.vehicle.class))
      : securityStaff.filter((s) => (draft.service === 'guard' ? s.kind === 'guard' : s.kind === 'gunman'));

  const title = kind === 'driver' ? 'Choose a driver' : draft.service === 'guard' ? 'Choose a guard' : 'Choose a lead';

  return (
    <Screen header={<Header title={title} />}>
      <View style={styles.list}>
        {list.map((s) => (
          <StaffCard key={s.id} staff={s} onPress={() => router.push(`/book/driver/${s.id}`)} />
        ))}
      </View>
      <Text variant="caption" tone="muted" style={styles.note}>
        Profiles are shown by fit. My Captain confirms the final assignment and can arrange a replacement.
      </Text>
    </Screen>
  );
}

function StaffCard({ staff, onPress }: { staff: StaffProfile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[styles.card, pressed && { opacity: 0.8 }]}>
          <Avatar name={staff.name} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{staff.name}</Text>
            <Text variant="label" tone="muted">
              {staff.specialty}, {staff.years} yrs
            </Text>
            <Text variant="caption" tone="muted">
              {staff.company}
            </Text>
            <Text variant="label" tone="accent">
              Available in {staff.eta}
            </Text>
          </View>
          <View style={styles.rating}>
            <Star color={colors.amber} fill={colors.amber} size={14} strokeWidth={iconStroke} />
            <Text variant="label">{staff.rating.toFixed(1)}</Text>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  note: { marginTop: space.xl },
});
