import { Building2, FileCheck2, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, ChipGroup, DetailRow, Header, Screen, Section, Text } from '@/components/ui';
import { SwitchRow } from '@/components/ui/switch-row';
import { findStaff } from '@/lib/mock-data';
import { useAuth } from '@/stores/auth';
import { colors, space } from '@/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Availability() {
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [shift, setShift] = useState<'day' | 'night' | 'any'>('day');
  const [available, setAvailable] = useState(true);
  const [saved, setSaved] = useState(false);
  const toggle = (d: string) => {
    setSaved(false);
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  };

  return (
    <Screen header={<Header title="Availability" />} footer={<Button label={saved ? 'Saved' : 'Save availability'} onPress={() => setSaved(true)} />}>
      <View style={styles.form}>
        <SwitchRow
          title="Available for new assignments"
          subtitle="Your company sees this when assigning work"
          value={available}
          onChange={(v) => (setAvailable(v), setSaved(false))}
        />
        <Section title="Working days">
          <View style={styles.days}>
            {DAYS.map((d) => (
              <View key={d}>
                <ChipGroup value={days.includes(d) ? d : undefined} onChange={() => toggle(d)} options={[{ label: d, value: d }]} />
              </View>
            ))}
          </View>
        </Section>
        <Section title="Preferred shift">
          <ChipGroup
            value={shift}
            onChange={(v) => (setShift(v), setSaved(false))}
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Night', value: 'night' },
              { label: 'Any', value: 'any' },
            ]}
          />
        </Section>
      </View>
    </Screen>
  );
}

const history = [
  { id: 'MC-2031', label: '8h duty, Gulshan-e-Iqbal', date: '24 Sep', in: '09:02', out: '17:05' },
  { id: 'MC-2027', label: '4h duty, DHA Phase 5', date: '23 Sep', in: '17:00', out: '21:10' },
  { id: 'MC-2020', label: '8h duty, Clifton', date: '21 Sep', in: '08:55', out: '17:00' },
  { id: 'MC-2014', label: '4h duty, PECHS', date: '19 Sep', in: '13:58', out: '18:00' },
];

export function DutyHistory() {
  return (
    <Screen header={<Header title="Duty history" />}>
      <View style={{ gap: space.md }}>
        {history.map((h) => (
          <Card key={h.id} style={{ gap: 4 }}>
            <View style={styles.between}>
              <Text variant="heading">{h.label}</Text>
              <Text variant="caption" tone="muted">
                {h.date}
              </Text>
            </View>
            <Text variant="label" tone="muted">
              {h.id}, checked in {h.in}, out {h.out}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const docs = [
  { name: 'CNIC', status: 'Verified', tone: 'green' as const },
  { name: 'Driving licence', status: 'Verified', tone: 'green' as const },
  { name: 'Police character certificate', status: 'Verified', tone: 'green' as const },
  { name: 'Medical fitness', status: 'Renew by 30 Nov', tone: 'amber' as const },
  { name: 'Training certificate', status: 'Verified', tone: 'green' as const },
];

export function Documents() {
  return (
    <Screen header={<Header title="Documents" />}>
      <View style={{ gap: space.md }}>
        {docs.map((d) => (
          <Card key={d.name} style={styles.doc}>
            <FileCheck2 color={colors.blue} size={22} strokeWidth={1.75} />
            <Text variant="heading" style={{ flex: 1 }}>
              {d.name}
            </Text>
            <Badge label={d.status} tone={d.tone} />
          </Card>
        ))}
        <Text variant="caption" tone="muted">
          Documents are uploaded and renewed by your company on the partner portal.
        </Text>
      </View>
    </Screen>
  );
}

export function MyCompany() {
  const user = useAuth((s) => s.user);
  const company = findStaff(user?.role === 'guard' ? 'g1' : 'd1')?.company ?? 'Partner company';
  return (
    <Screen header={<Header title="Your company" />}>
      <View style={styles.form}>
        <Card style={{ gap: space.md }}>
          <Building2 color={colors.blue} size={28} strokeWidth={1.75} />
          <Text variant="title">{company}</Text>
          <Badge label="Verified My Captain partner" tone="green" />
          <View>
            <DetailRow label="Licence" value="PSRA-KHI-0412" />
            <DetailRow label="Supervisor" value="Tariq Hussain" />
            <DetailRow label="Office" value="Shahrah-e-Faisal, Karachi" />
          </View>
        </Card>
        <Button
          label="Call supervisor"
          variant="secondary"
          icon={<Phone color={colors.text} size={20} strokeWidth={1.75} />}
          onPress={() => Linking.openURL('tel:+923000000000')}
        />
        <Text variant="caption" tone="muted">
          Pay, leave and account changes are handled by your company.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  doc: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
