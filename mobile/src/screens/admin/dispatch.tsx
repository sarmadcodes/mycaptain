import { router, useLocalSearchParams } from 'expo-router';
import { Building2, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, Header, Screen, Section, Segmented, SelectCard, Text } from '@/components/ui';
import { formatPKR } from '@/features/booking/pricing';
import { requests, type Request } from '@/lib/admin-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

import { AdminPage } from './page';

export function AdminDispatch() {
  const r = useResponsive();
  const [tab, setTab] = useState<'new' | 'assigned'>('new');
  const list = requests.filter((q) => q.status === tab);
  const cols = r.tablet ? 2 : 1;
  const w = cols === 1 ? '100%' : r.columnWidth(cols, space.md);

  return (
    <AdminPage title="Dispatch" subtitle="Assign new bookings to partner companies">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { label: `New (${requests.filter((q) => q.status === 'new').length})`, value: 'new' },
          { label: 'Assigned', value: 'assigned' },
        ]}
      />
      <View style={styles.grid}>
        {list.map((q) => (
          <View key={q.id} style={{ width: w }}>
            <RequestCard q={q} />
          </View>
        ))}
      </View>
    </AdminPage>
  );
}

function RequestCard({ q }: { q: Request }) {
  return (
    <Pressable onPress={() => router.push(`/dispatch/${q.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.between}>
            <Badge label={q.status === 'new' ? 'Needs assignment' : 'Assigned'} tone={q.status === 'new' ? 'amber' : 'green'} />
            <Text variant="caption" tone="muted">
              {q.id}
            </Text>
          </View>
          <Text variant="heading">{q.title}</Text>
          <Text variant="label" tone="muted">
            {q.when}, {q.location}
          </Text>
          <View style={styles.between}>
            <Text variant="label">{q.customer}</Text>
            <Text variant="label">{formatPKR(q.amount)}</Text>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const partners: Record<string, { name: string; note: string }[]> = {
  driver: [
    { name: 'Karachi Chauffeurs', note: '12 drivers free, closest 2.1 km' },
    { name: 'Elite Drive Services', note: '5 drivers free, closest 4.8 km' },
  ],
  rental: [
    { name: 'Karachi Chauffeurs', note: 'Fortuner available, rating 4.9' },
    { name: 'Elite Drive Services', note: 'Fortuner available, rating 4.8' },
  ],
  security: [
    { name: 'Shield Force Security', note: '18 guards free, licence valid' },
    { name: 'Falcon Guard Services', note: '9 guards free, armed team ready' },
  ],
};

export function DispatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = requests.find((x) => x.id === id);
  const [pick, setPick] = useState<string | undefined>(q?.assignedTo);
  const [done, setDone] = useState(q?.status === 'assigned');

  if (!q) {
    return (
      <Screen header={<Header />}>
        <Text tone="muted">Request not found.</Text>
      </Screen>
    );
  }
  const options = partners[q.service === 'driver' || q.service === 'rental' ? q.service : 'security'];

  return (
    <Screen
      header={<Header title={q.id} />}
      footer={
        done ? (
          <Button label="Back to dispatch" variant="secondary" onPress={() => router.back()} />
        ) : (
          <Button label="Assign booking" disabled={!pick} onPress={() => setDone(true)} />
        )
      }>
      <View style={{ gap: space.xl }}>
        {done ? (
          <Card tinted style={styles.done}>
            <CheckCircle2 color={colors.green} size={22} strokeWidth={1.75} />
            <Text variant="heading" style={{ flex: 1 }}>
              Assigned to {pick}. The company picks the captain and the customer is notified.
            </Text>
          </Card>
        ) : null}
        <Card style={{ gap: 0 }}>
          <DetailRow label="Service" value={q.title} />
          <DetailRow label="Customer" value={q.customer} />
          <DetailRow label="When" value={q.when} />
          <DetailRow label="Location" value={q.location} />
          <DetailRow label="Details" value={q.detail} />
          <DetailRow label="Paid" value={formatPKR(q.amount)} strong />
        </Card>
        <Section title="Suggested partners">
          {options.map((p) => (
            <SelectCard
              key={p.name}
              icon={Building2}
              title={p.name}
              subtitle={p.note}
              selected={pick === p.name}
              onPress={() => !done && setPick(p.name)}
            />
          ))}
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  done: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
