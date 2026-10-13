import { router } from 'expo-router';
import { BadgeCheck, UserRoundSearch } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, EmptyView, ErrorView, Header, LoadingView, Screen, Text } from '@/components/ui';
import { useStaffProfiles } from '@/features/api';
import { useBookingDraft } from '@/features/booking/store';
import { colors, iconStroke, space } from '@/theme';
import type { StaffProfileApi } from '@/types/api';

// Customers may pick a preferred captain, or let My Captain assign the best match.
export function StaffList({ kind }: { kind: 'driver' | 'security' }) {
  const service = useBookingDraft((s) => s.service);
  const set = useBookingDraft((s) => s.set);
  const staffKind = kind === 'driver' ? 'driver' : service === 'guard' ? 'guard' : 'gunman';
  const { data, isLoading, error, refetch } = useStaffProfiles(staffKind);
  const title = kind === 'driver' ? 'Choose a driver' : service === 'guard' ? 'Choose a guard' : 'Choose a lead';

  const autoAssign = () => {
    set({ staffId: undefined, staffName: undefined });
    router.push('/book/schedule');
  };

  return (
    <Screen header={<Header title={title} />} footer={<Button label="Let My Captain choose" variant="secondary" onPress={autoAssign} />}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : !data?.staff.length ? (
        <EmptyView
          icon={UserRoundSearch}
          title="We will assign the best match"
          body="No profiles to choose from in your area yet. Continue and our team assigns a verified captain."
        />
      ) : (
        <View style={styles.list}>
          {data.staff.map((s) => (
            <StaffCard key={s.id} staff={s} onPress={() => router.push(`/book/driver/${s.id}`)} />
          ))}
        </View>
      )}
      <Text variant="caption" tone="muted" style={styles.note}>
        A preferred captain is assigned when available. Otherwise we assign one with matching experience.
      </Text>
    </Screen>
  );
}

function StaffCard({ staff, onPress }: { staff: StaffProfileApi; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[styles.card, pressed && { opacity: 0.8 }]}>
          <Avatar name={staff.name} size={52} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{staff.name}</Text>
            <Text variant="label" tone="muted">
              {staff.companyName}
            </Text>
          </View>
          {staff.verified ? <BadgeCheck color={colors.green} size={20} strokeWidth={iconStroke} /> : null}
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  note: { marginTop: space.xl },
});
