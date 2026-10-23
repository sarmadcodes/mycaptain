import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, ErrorView, Header, LoadingView, Screen, Text, TextField } from '@/components/ui';
import { useRates, useUpdateRates } from '@/features/api';
import { errorMessage } from '@/services/api/client';
import type { Rates } from '@/types/api';
import { SwitchRow } from '@/components/ui/switch-row';
import { formatPKR } from '@/features/booking/pricing';
import { useGeneratePayouts, useMarkPayoutPaid, usePayoutPreview, usePayouts } from '@/features/ops';
import { space } from '@/theme';

const FIELDS = [
  { key: 'small', label: 'Driver, small car', unit: 'PKR per hour' },
  { key: 'sedan', label: 'Driver, sedan', unit: 'PKR per hour' },
  { key: 'suv', label: 'Driver, SUV', unit: 'PKR per hour' },
  { key: 'luxury', label: 'Driver, luxury', unit: 'PKR per hour' },
  { key: 'guard', label: 'Security guard (bouncer)', unit: 'PKR per hour' },
  { key: 'gunman', label: 'Armed gunman', unit: 'PKR per hour' },
  { key: 'fee', label: 'Platform fee', unit: 'percent' },
  { key: 'rentalMin', label: 'Rental minimum', unit: 'hours' },
] as const;
type Key = (typeof FIELDS)[number]['key'];

export function RateCards() {
  const { data, isLoading, error, refetch } = useRates();
  if (isLoading) return <Screen header={<Header title="Rate cards" />}><LoadingView /></Screen>;
  if (error || !data) return <Screen header={<Header title="Rate cards" />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  return <RateForm rates={data.rates} />;
}

function RateForm({ rates }: { rates: Rates }) {
  const update = useUpdateRates();
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<Record<Key, string>>({
    small: String(rates.driverHourly.small),
    sedan: String(rates.driverHourly.sedan),
    suv: String(rates.driverHourly.suv),
    luxury: String(rates.driverHourly.luxury),
    guard: String(rates.guardHourly),
    gunman: String(rates.gunmanHourly),
    fee: String(rates.feePercent),
    rentalMin: String(rates.rentalMinHours),
  });
  const n = (k: Key) => Number(values[k] || 0);

  const save = async () => {
    setSaved(false);
    await update.mutateAsync({
      ...rates,
      driverHourly: { small: n('small'), sedan: n('sedan'), suv: n('suv'), luxury: n('luxury') },
      guardHourly: n('guard'),
      gunmanHourly: n('gunman'),
      feePercent: n('fee'),
      rentalMinHours: n('rentalMin'),
    });
    setSaved(true);
  };

  return (
    <Screen
      header={<Header title="Rate cards" />}
      footer={
        <>
          {update.error ? (
            <Text variant="caption" tone="danger">
              {errorMessage(update.error)}
            </Text>
          ) : null}
          <Button label={saved ? 'Saved' : 'Save rates'} loading={update.isPending} onPress={() => save().catch(() => {})} />
        </>
      }>
      <View style={{ gap: space.xl }}>
        <Text tone="muted">Prices customers see in the app. Changes apply to new bookings straight away.</Text>
        {FIELDS.map((f) => (
          <TextField
            key={f.key}
            label={`${f.label}, ${f.unit}`}
            keyboardType="number-pad"
            value={values[f.key]}
            onChangeText={(t) => {
              setSaved(false);
              setValues((s) => ({ ...s, [f.key]: t.replace(/\D/g, '') }));
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const range = (from: string, to: string) =>
  `${new Date(from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to ${new Date(to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

// Statements for partner companies: work done in a period, then marked paid with the bank reference.
export function Payouts() {
  const list = usePayouts();
  const generate = useGeneratePayouts();
  const markPaid = useMarkPayoutPaid();
  const [refs, setRefs] = useState<Record<string, string>>({});

  // Default period: the last 7 full days.
  const to = dayStart(new Date());
  const from = new Date(to.getTime() - 7 * 86_400_000);
  const preview = usePayoutPreview(from.toISOString(), to.toISOString());
  const due = preview.data?.items ?? [];

  return (
    <Screen header={<Header title="Payouts" />}>
      <View style={{ gap: space.lg }}>
        <Text tone="muted">Partners are owed the booking price less the platform fee for every completed duty.</Text>

        <Card style={{ gap: space.md }}>
          <Text variant="heading">Ready to bill, {range(from.toISOString(), to.toISOString())}</Text>
          {preview.isLoading ? (
            <LoadingView />
          ) : due.length ? (
            due.map((d) => <DetailRow key={d.company.id} label={`${d.company.name ?? 'Company'}, ${d.count} duties`} value={formatPKR(d.amount)} />)
          ) : (
            <Text tone="muted">No unbilled completed duties in this period.</Text>
          )}
          <Button
            label="Create statements"
            disabled={!due.length}
            loading={generate.isPending}
            onPress={() => generate.mutate({ from: from.toISOString(), to: to.toISOString() })}
          />
          {generate.error ? (
            <Text variant="caption" tone="danger">
              {errorMessage(generate.error)}
            </Text>
          ) : null}
        </Card>

        {list.isLoading ? (
          <LoadingView />
        ) : list.error ? (
          <ErrorView error={list.error} onRetry={list.refetch} />
        ) : (
          (list.data?.items ?? []).map((p) => (
            <Card key={p.id} style={{ gap: space.sm }}>
              <View style={styles.between}>
                <Text variant="heading" style={{ flex: 1 }}>
                  {p.company.tradingName || p.company.legalName}
                </Text>
                <Badge label={p.status === 'paid' ? 'Paid' : 'Scheduled'} tone={p.status === 'paid' ? 'green' : 'blue'} />
              </View>
              <DetailRow label={`${range(p.periodStart, p.periodEnd)}, ${p.count} duties`} value={formatPKR(p.amount)} strong />
              {p.status === 'paid' ? (
                <Text variant="caption" tone="muted">
                  Sent {new Date(p.paidAt!).toLocaleDateString('en-GB')}, reference {p.reference}
                </Text>
              ) : (
                <View style={{ gap: space.sm }}>
                  <TextField
                    label="Bank transfer reference"
                    value={refs[p.id] ?? ''}
                    onChangeText={(t) => setRefs((r) => ({ ...r, [p.id]: t }))}
                    placeholder="e.g. IBFT-778812"
                  />
                  <Button
                    label="Mark paid"
                    variant="secondary"
                    disabled={(refs[p.id] ?? '').trim().length < 3}
                    loading={markPaid.isPending && markPaid.variables?.id === p.id}
                    onPress={() => markPaid.mutate({ id: p.id, reference: refs[p.id]!.trim() })}
                  />
                </View>
              )}
            </Card>
          ))
        )}
        {markPaid.error ? (
          <Text variant="caption" tone="danger">
            {errorMessage(markPaid.error)}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export function ServiceCities() {
  const [on, setOn] = useState<string[]>(['Karachi', 'Lahore', 'Islamabad']);
  return (
    <Screen header={<Header title="Service cities" />}>
      <Text tone="muted" style={{ marginBottom: space.md }}>
        Customers can only book in live cities. Others show as coming soon.
      </Text>
      {CITIES.map((c) => (
        <SwitchRow
          key={c}
          title={c}
          subtitle={on.includes(c) ? 'Live' : 'Coming soon'}
          value={on.includes(c)}
          onChange={(v) => setOn((s) => (v ? [...s, c] : s.filter((x) => x !== c)))}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
});
