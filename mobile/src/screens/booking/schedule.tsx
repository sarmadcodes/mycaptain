import { router } from 'expo-router';
import { CalendarDays, Clock, Hourglass, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Header, Screen, Section, Segmented, Select, SelectCard, Text, TextField } from '@/components/ui';
import { formatPKR, quote } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';
import { addDays, addMonths, dateOptions, firstOpenTime, formatDate, formatTime, timeOptions } from '@/utils/datetime';

const hourOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => ({ label: `${h} ${h === 1 ? 'hour' : 'hours'}`, value: h }));
const dayOptions = Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1} ${i ? 'days' : 'day'}`, value: i + 1 }));

export function ScheduleStep() {
  const draft = useBookingDraft();
  const { set } = draft;
  const { tablet } = useResponsive();
  const [error, setError] = useState<string>();
  const isDriver = draft.service === 'driver';
  const longTerm = draft.plan === 'monthly' || draft.plan === 'contract';
  // Monthly and contract plans always need a start date.
  const scheduled = draft.start === 'later' || longTerm;
  const price = quote(draft);

  const setDate = (date: string) => {
    // Keep the time if still valid on the new date, otherwise jump to the first open slot.
    const valid = timeOptions(date).find((t) => t.value === draft.time && !t.disabled);
    set({ date, time: valid ? draft.time : firstOpenTime(date) });
  };

  const summary = (() => {
    const start = scheduled ? `${formatDate(draft.date)} at ${formatTime(draft.time)}` : 'Within 30 minutes';
    switch (draft.plan) {
      case 'hourly':
        return `${start}, for ${draft.hours} ${draft.hours === 1 ? 'hour' : 'hours'}`;
      case 'daily':
        return draft.days === 1 ? `${start}, 8 hours` : `${start} until ${formatDate(addDays(draft.date, draft.days - 1))}, 8 hours a day`;
      case 'monthly':
        return `Starts ${formatDate(draft.date)}. Renews ${addMonths(draft.date, 1)}.`;
      case 'contract':
        return `Starts ${formatDate(draft.date)}. Ends ${addMonths(draft.date, draft.contractMonths)}.`;
    }
  })();

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
        <Section title="Plan">
          <Segmented
            value={draft.plan}
            onChange={(v) => set({ plan: v })}
            options={[
              { label: 'Hourly', value: 'hourly' },
              { label: 'Daily', value: 'daily' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Contract', value: 'contract' },
            ]}
          />
        </Section>

        {!longTerm ? (
          <Section title="When">
            <View style={[styles.when, tablet && styles.row]}>
              <View style={tablet ? styles.col : undefined}>
                <SelectCard
                  icon={Zap}
                  title="As soon as possible"
                  subtitle="A captain arrives within 30 minutes"
                  selected={draft.start === 'now'}
                  onPress={() => set({ start: 'now' })}
                />
              </View>
              <View style={tablet ? styles.col : undefined}>
                <SelectCard
                  icon={CalendarDays}
                  title="Schedule"
                  subtitle="Pick a date and time"
                  selected={draft.start === 'later'}
                  onPress={() => set({ start: 'later' })}
                />
              </View>
            </View>
          </Section>
        ) : null}

        {scheduled ? (
          <View style={tablet ? styles.row : styles.when}>
            <View style={tablet ? styles.col : undefined}>
              <Select
                label={longTerm ? 'Start date' : 'Date'}
                icon={CalendarDays}
                value={draft.date}
                options={dateOptions(longTerm ? 60 : 30)}
                onChange={setDate}
              />
            </View>
            <View style={tablet ? styles.col : undefined}>
              <Select
                label={longTerm ? 'Daily start' : 'Time'}
                icon={Clock}
                value={draft.time}
                options={timeOptions(draft.date)}
                onChange={(time) => set({ time })}
              />
            </View>
          </View>
        ) : null}

        {draft.plan === 'hourly' ? (
          <Select label="Duration" icon={Hourglass} value={draft.hours} options={hourOptions} onChange={(hours) => set({ hours })} />
        ) : null}
        {draft.plan === 'daily' ? (
          <Select
            label="Number of days"
            icon={Hourglass}
            value={draft.days}
            options={dayOptions}
            onChange={(days) => set({ days })}
            sheetTitle="How many days?"
          />
        ) : null}
        {draft.plan === 'contract' ? (
          <Select
            label="Contract length"
            icon={Hourglass}
            value={draft.contractMonths}
            options={[
              { label: '6 months', value: 6, hint: '20% off hourly rates' },
              { label: '1 year', value: 12, hint: '20% off hourly rates, priority replacements' },
            ]}
            onChange={(contractMonths) => set({ contractMonths })}
          />
        ) : null}
        {draft.plan === 'monthly' ? (
          <Text variant="label" tone="muted">
            A regular captain 26 days a month, 8 hours a day, with backup cover on leave days.
          </Text>
        ) : null}

        <Card tinted style={{ gap: 4 }}>
          <Text variant="caption" tone="muted">
            Your schedule
          </Text>
          <Text variant="heading" style={{ color: colors.navy }}>
            {summary}
          </Text>
        </Card>

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
  when: { gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
  col: { flex: 1, minWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
});
