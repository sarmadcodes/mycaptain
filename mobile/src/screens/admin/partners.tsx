import { router, useLocalSearchParams } from 'expo-router';
import { CircleAlert, FileCheck2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, Header, Screen, Section, Segmented, Text } from '@/components/ui';
import { applications, type Application } from '@/lib/admin-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

import { AdminPage } from './page';

const tone = { Pending: 'amber', Approved: 'green', 'Changes requested': 'red' } as const;

export function AdminPartners() {
  const r = useResponsive();
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const list = applications.filter((a) => (tab === 'pending' ? a.status !== 'Approved' : a.status === 'Approved'));
  const w = r.tablet ? r.columnWidth(2, space.md) : '100%';

  return (
    <AdminPage title="Partners" subtitle="Company applications from the partner website">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { label: 'Applications', value: 'pending' },
          { label: 'Approved', value: 'approved' },
        ]}
      />
      <View style={styles.grid}>
        {list.map((a) => (
          <View key={a.id} style={{ width: w }}>
            <AppCard a={a} />
          </View>
        ))}
      </View>
    </AdminPage>
  );
}

function AppCard({ a }: { a: Application }) {
  return (
    <Pressable onPress={() => router.push(`/partners/${a.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.between}>
            <Badge label={a.status} tone={tone[a.status]} />
            <Text variant="caption" tone="muted">
              {a.submitted}
            </Text>
          </View>
          <Text variant="heading">{a.company}</Text>
          <Text variant="label" tone="muted">
            {a.city}, {a.staff}
          </Text>
          <Text variant="label" tone="muted" numberOfLines={1}>
            {a.services}
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

export function PartnerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = applications.find((x) => x.id === id);
  const [status, setStatus] = useState(a?.status);

  if (!a || !status) {
    return (
      <Screen header={<Header />}>
        <Text tone="muted">Application not found.</Text>
      </Screen>
    );
  }
  const missing = a.docs.filter((d) => !d.ok).length;

  return (
    <Screen
      header={<Header title={a.id} />}
      footer={
        status === 'Pending' ? (
          <View style={styles.footer}>
            <Button
              label="Request changes"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => setStatus('Changes requested')}
            />
            <Button label="Approve" style={{ flex: 1 }} disabled={missing > 0} onPress={() => setStatus('Approved')} />
          </View>
        ) : (
          <Button label="Back to partners" variant="secondary" onPress={() => router.back()} />
        )
      }>
      <View style={{ gap: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Badge label={status} tone={tone[status]} />
          <Text variant="title">{a.company}</Text>
        </View>
        <Card style={{ gap: 0 }}>
          <DetailRow label="Head office" value={a.city} />
          <DetailRow label="Services" value={a.services} />
          <DetailRow label="Team size" value={a.staff} />
          <DetailRow label="Licence" value={a.licence} />
          <DetailRow label="Contact" value={a.contact} />
          <DetailRow label="Submitted" value={a.submitted} />
        </Card>
        <Section title="Documents">
          {a.docs.map((d) => (
            <Card key={d.name} style={styles.doc}>
              {d.ok ? (
                <FileCheck2 color={colors.green} size={20} strokeWidth={1.75} />
              ) : (
                <CircleAlert color={colors.red} size={20} strokeWidth={1.75} />
              )}
              <Text variant="heading" style={{ flex: 1 }}>
                {d.name}
              </Text>
              <Badge label={d.ok ? 'Verified' : 'Missing'} tone={d.ok ? 'green' : 'red'} />
            </Card>
          ))}
        </Section>
        {missing > 0 && status === 'Pending' ? (
          <Text variant="caption" tone="danger">
            Approval is blocked until all documents are verified. Request changes to ask the company to upload them.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  doc: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footer: { flexDirection: 'row', gap: space.md },
});
