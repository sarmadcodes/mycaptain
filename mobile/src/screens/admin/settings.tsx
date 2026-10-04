import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, Header, Screen, Text, TextField } from '@/components/ui';
import { SwitchRow } from '@/components/ui/switch-row';
import { formatPKR } from '@/features/booking/pricing';
import { payouts, rateCard } from '@/lib/admin-data';
import { space } from '@/theme';

export function RateCards() {
  const [rates, setRates] = useState(Object.fromEntries(rateCard.map((r) => [r.key, String(r.value)])));
  const [saved, setSaved] = useState(false);

  return (
    <Screen
      header={<Header title="Rate cards" />}
      footer={<Button label={saved ? 'Saved' : 'Save rates'} onPress={() => setSaved(true)} />}>
      <View style={{ gap: space.xl }}>
        <Text tone="muted">Prices customers see in the app. Changes apply to new bookings only.</Text>
        {rateCard.map((r) => (
          <TextField
            key={r.key}
            label={`${r.label}, ${r.unit}`}
            keyboardType="number-pad"
            value={rates[r.key]}
            onChangeText={(t) => {
              setSaved(false);
              setRates((s) => ({ ...s, [r.key]: t.replace(/\D/g, '') }));
            }}
            prefix={
              r.unit === 'percent' ? undefined : (
                <Text variant="label" tone="muted">
                  PKR
                </Text>
              )
            }
            suffix={
              r.unit === 'percent' ? (
                <Text variant="label" tone="muted">
                  %
                </Text>
              ) : undefined
            }
          />
        ))}
      </View>
    </Screen>
  );
}

export function Payouts() {
  return (
    <Screen header={<Header title="Payouts" />}>
      <View style={{ gap: space.md }}>
        <Text tone="muted">Weekly transfers to partner companies for completed duties.</Text>
        {payouts.map((p) => (
          <Card key={p.company + p.period} style={{ gap: 4 }}>
            <View style={styles.between}>
              <Text variant="heading" style={{ flex: 1 }}>
                {p.company}
              </Text>
              <Badge label={p.status} tone={p.status === 'Paid' ? 'green' : 'blue'} />
            </View>
            <DetailRow label={p.period} value={formatPKR(p.amount)} />
          </Card>
        ))}
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
