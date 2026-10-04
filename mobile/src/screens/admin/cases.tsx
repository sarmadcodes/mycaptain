import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, Header, Screen, Section, Segmented, Text, TextField } from '@/components/ui';
import { adminCases, type AdminCase } from '@/lib/admin-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

import { AdminPage } from './page';

const statusTone = { Open: 'red', 'In progress': 'amber', Resolved: 'green' } as const;

export function AdminCases() {
  const r = useResponsive();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const list = adminCases.filter((c) => (tab === 'open' ? c.status !== 'Resolved' : c.status === 'Resolved'));
  const w = r.tablet ? r.columnWidth(2, space.md) : '100%';

  return (
    <AdminPage title="Cases" subtitle="Accidents, complaints and replacements">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { label: 'Open', value: 'open' },
          { label: 'Resolved', value: 'resolved' },
        ]}
      />
      <View style={styles.grid}>
        {list.map((c) => (
          <View key={c.id} style={{ width: w }}>
            <CaseCard c={c} />
          </View>
        ))}
      </View>
    </AdminPage>
  );
}

function CaseCard({ c }: { c: AdminCase }) {
  return (
    <Pressable onPress={() => router.push(`/cases/${c.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.between}>
            <View style={styles.badges}>
              <Badge label={c.type} tone="blue" />
              {c.urgent ? <Badge label="Urgent" tone="red" /> : null}
            </View>
            <Badge label={c.status} tone={statusTone[c.status]} />
          </View>
          <Text variant="heading">
            {c.id}, booking {c.booking}
          </Text>
          <Text variant="label" tone="muted" numberOfLines={2}>
            {c.summary}
          </Text>
          <Text variant="caption" tone="faint">
            Opened {c.opened}
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

export function CaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = adminCases.find((x) => x.id === id);
  const [status, setStatus] = useState(c?.status);
  const [note, setNote] = useState('');
  const [timeline, setTimeline] = useState(c?.timeline ?? []);

  if (!c || !status) {
    return (
      <Screen header={<Header />}>
        <Text tone="muted">Case not found.</Text>
      </Screen>
    );
  }

  const log = (text: string) => setTimeline((t) => [...t, { time: 'Now', text }]);

  return (
    <Screen
      header={<Header title={c.id} />}
      footer={
        status === 'Resolved' ? (
          <Button label="Reopen case" variant="secondary" onPress={() => (setStatus('In progress'), log('Case reopened'))} />
        ) : (
          <Button label="Mark resolved" onPress={() => (setStatus('Resolved'), log('Marked resolved by operations'))} />
        )
      }>
      <View style={{ gap: space.xl }}>
        <View style={styles.badges}>
          <Badge label={c.type} tone="blue" />
          <Badge label={status} tone={statusTone[status]} />
          {c.urgent ? <Badge label="Urgent" tone="red" /> : null}
        </View>
        <Text>{c.summary}</Text>
        <Card style={{ gap: 0 }}>
          <DetailRow label="Booking" value={c.booking} />
          <DetailRow label="Customer" value={c.customer} />
          <DetailRow label="Staff" value={c.staff} />
          <DetailRow label="Opened" value={c.opened} />
        </Card>

        <Section title="Actions">
          <View style={styles.actions}>
            <Button label="Assign replacement" variant="secondary" onPress={() => log('Replacement requested from partner')} />
            <Button label="Start refund review" variant="secondary" onPress={() => log('Refund review started')} />
            <Button label="Call customer" variant="secondary" onPress={() => log('Customer called')} />
          </View>
        </Section>

        <Section title="Timeline">
          {timeline.map((t, i) => (
            <View key={i} style={styles.timeRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body">{t.text}</Text>
                <Text variant="caption" tone="faint">
                  {t.time}
                </Text>
              </View>
            </View>
          ))}
        </Section>

        <TextField
          label="Internal note"
          placeholder="Visible to operations only"
          value={note}
          onChangeText={setNote}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (note.trim()) {
              log(`Note: ${note.trim()}`);
              setNote('');
            }
          }}
          hint="Press return to add it to the timeline."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actions: { gap: space.sm },
  timeRow: { flexDirection: 'row', gap: space.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 7 },
});
