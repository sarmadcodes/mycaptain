import { router } from 'expo-router';
import { Shield, ShieldCheck, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Header, Screen, SelectCard, Stepper, Text } from '@/components/ui';
import { formatPKR } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { colors, space } from '@/theme';

export function SecurityTypeStep() {
  const service = useBookingDraft((s) => s.service);
  const personnel = useBookingDraft((s) => s.personnel);
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
          title="Security guard (bouncer)"
          subtitle="Unarmed cover for a home, office, venue or event"
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
          subtitle="One armed lead with the guards you need"
          selected={service === 'team'}
          onPress={() => set({ service: 'team', personnel: Math.max(personnel, 2) })}
        />
      </View>

      {service === 'team' ? (
        <Card tinted style={styles.team}>
          <View style={{ flex: 1, minWidth: 160, gap: 2 }}>
            <Text variant="heading">Guards required</Text>
            <Text variant="label" tone="muted">
              Plus 1 armed lead. Team of {personnel + 1}.
            </Text>
          </View>
          <Stepper value={personnel} min={1} max={20} onChange={(v) => set({ personnel: v })} />
        </Card>
      ) : null}

      <Text variant="caption" tone="muted" style={{ marginTop: space.xl }}>
        {service === 'guard'
          ? `Guards from ${formatPKR(700)} per hour.`
          : 'Armed bookings go through company eligibility checks before assignment.'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  options: { gap: space.md },
  team: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    marginTop: space.lg,
    borderColor: colors.paleBlue,
  },
});
