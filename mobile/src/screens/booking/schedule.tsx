import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ChipGroup, Header, Screen, Section, Stepper, Text, TextField } from '@/components/ui';
import { formatPKR, quote } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { space } from '@/theme';

const times = ['8:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '5:00 PM', '8:00 PM'];

export function ScheduleStep() {
  const draft = useBookingDraft();
  const { set } = draft;
  const [error, setError] = useState<string>();
  const isDriver = draft.service === 'driver';
  const price = quote(draft);

  const next = () => {
    if (isDriver && draft.location.trim().length < 4) return setError('Enter where the driver should come.');
    setError(undefined);
    router.push('/book/review');
  };

  return (
    <Screen
      header={<Header title="Schedule" />}
      footer={
        <View style={styles.footer}>
          <View>
            <Text variant="caption" tone="muted">
              Estimated total
            </Text>
            <Text variant="heading">{formatPKR(price.total)}</Text>
          </View>
          <Button label="Review" onPress={next} style={{ flex: 1 }} />
        </View>
      }>
      <View style={styles.form}>
        <Section title="Start">
          <ChipGroup
            value={draft.start}
            onChange={(v) => set({ start: v })}
            options={[
              { label: 'Now, within 30 min', value: 'now' },
              { label: 'Schedule for later', value: 'later' },
            ]}
          />
          {draft.start === 'later' ? (
            <View style={{ gap: space.md }}>
              <ChipGroup
                value={draft.day}
                onChange={(v) => set({ day: v })}
                options={[
                  { label: 'Today', value: 'today' },
                  { label: 'Tomorrow', value: 'tomorrow' },
                ]}
              />
              <ChipGroup value={draft.time} onChange={(v) => set({ time: v })} options={times.map((t) => ({ label: t, value: t }))} />
            </View>
          ) : null}
        </Section>

        <Section title="Duration">
          <ChipGroup
            value={draft.plan}
            onChange={(v) => set({ plan: v })}
            options={[
              { label: 'Hourly', value: 'hourly' },
              { label: 'Daily', value: 'daily' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Contract', value: 'contract' },
            ]}
          />
          {draft.plan === 'hourly' ? (
            <ChipGroup
              value={draft.hours}
              onChange={(v) => set({ hours: v })}
              options={[1, 2, 4, 8, 12].map((h) => ({ label: `${h} h`, value: h }))}
            />
          ) : null}
          {draft.plan === 'daily' ? <Stepper value={draft.days} max={30} suffix={draft.days === 1 ? 'day' : 'days'} onChange={(v) => set({ days: v })} /> : null}
          {draft.plan === 'monthly' ? (
            <Text variant="label" tone="muted">
              A regular captain 26 days a month, 8 hours a day, with backup cover.
            </Text>
          ) : null}
          {draft.plan === 'contract' ? (
            <ChipGroup
              value={draft.contractMonths}
              onChange={(v) => set({ contractMonths: v })}
              options={[
                { label: '6 months', value: 6 },
                { label: '1 year', value: 12 },
              ]}
            />
          ) : null}
        </Section>

        {isDriver ? (
          <TextField
            label="Pickup location"
            placeholder="Address and nearby landmark"
            value={draft.location}
            onChangeText={(t) => set({ location: t })}
            error={error}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xxl },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
});
