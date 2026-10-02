import { router } from 'expo-router';
import { Shield, ShieldCheck, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, Header, Screen, SelectCard, Text } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { space } from '@/theme';

export function SecurityTypeStep() {
  const service = useBookingDraft((s) => s.service);
  const set = useBookingDraft((s) => s.set);

  return (
    <Screen
      header={<Header title="Security" />}
      footer={<Button label="Continue" onPress={() => router.push('/book/security/post')} />}>
      <View style={styles.intro}>
        <Text variant="title">What kind of cover?</Text>
        <Text tone="muted">All personnel are vetted and assigned by My Captain.</Text>
      </View>
      <View style={styles.options}>
        <SelectCard
          icon={Shield}
          title="Security guard"
          subtitle="Unarmed cover for a home, office or event"
          selected={service === 'guard'}
          onPress={() => set({ service: 'guard', personnel: 1 })}
        />
        <SelectCard
          icon={ShieldCheck}
          title="Armed gunman"
          subtitle="Licensed armed security personnel"
          selected={service === 'gunman'}
          onPress={() => set({ service: 'gunman', personnel: 1 })}
        />
        <SelectCard
          icon={Users}
          title="Security team"
          subtitle="One gunman with additional guards"
          selected={service === 'team'}
          onPress={() => set({ service: 'team', personnel: 3 })}
        />
      </View>
      {service !== 'guard' ? (
        <Text variant="caption" tone="muted" style={{ marginTop: space.xl }}>
          Armed bookings go through company eligibility checks before assignment.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  options: { gap: space.md },
});
