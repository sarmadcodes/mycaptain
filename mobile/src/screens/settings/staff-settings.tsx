import { Building2, FileCheck2, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, ChipGroup, DetailRow, EmptyView, ErrorView, Header, LoadingView, Screen, Section, Text } from '@/components/ui';
import { SwitchRow } from '@/components/ui/switch-row';
import { useBookings } from '@/features/api';
import { useMe, useMyCompany, useUpdateMe } from '@/features/ops';
import { colors, space } from '@/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DOC_LABEL: Record<string, string> = {
  cnic: 'CNIC',
  driving_licence: 'Driving licence',
  arms_licence: 'Arms licence',
  police_certificate: 'Police character certificate',
  medical: 'Medical fitness',
  training: 'Training certificate',
};
const DOC_STATUS = {
  verified: { label: 'Verified', tone: 'green' },
  pending: { label: 'In review', tone: 'amber' },
  rejected: { label: 'Rejected', tone: 'red' },
} as const;

export function Availability() {
  const me = useMe();
  const save = useUpdateMe();
  const [days, setDays] = useState<string[]>();
  const [shift, setShift] = useState<'day' | 'night' | 'any'>();
  const [available, setAvailable] = useState<boolean>();
  const [saved, setSaved] = useState(false);

  const u = me.data?.user;
  const cur = {
    days: days ?? u?.availability?.days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    shift: shift ?? u?.availability?.shift ?? 'any',
    available: available ?? u?.available ?? true,
  };
  const dirty = <T,>(set: (v: T) => void) => (v: T) => (set(v), setSaved(false));
  const toggle = (d: string) => dirty(setDays)(cur.days.includes(d) ? cur.days.filter((x) => x !== d) : [...cur.days, d]);

  return (
    <Screen
      header={<Header title="Availability" />}
      footer={
        <Button
          label={saved ? 'Saved' : 'Save availability'}
          loading={save.isPending}
          disabled={!u}
          onPress={() =>
            save.mutate(
              { available: cur.available, availability: { days: DAYS.filter((d) => cur.days.includes(d)), shift: cur.shift } },
              { onSuccess: () => setSaved(true) },
            )
          }
        />
      }>
      {me.isLoading ? (
        <LoadingView />
      ) : me.error ? (
        <ErrorView error={me.error} onRetry={me.refetch} />
      ) : (
        <View style={styles.form}>
          <SwitchRow
            title="Available for new assignments"
            subtitle="Your company sees this when assigning work"
            value={cur.available}
            onChange={dirty(setAvailable)}
          />
          <Section title="Working days">
            <View style={styles.days}>
              {DAYS.map((d) => (
                <View key={d}>
                  <ChipGroup value={cur.days.includes(d) ? d : undefined} onChange={() => toggle(d)} options={[{ label: d, value: d }]} />
                </View>
              ))}
            </View>
          </Section>
          <Section title="Preferred shift">
            <ChipGroup
              value={cur.shift}
              onChange={dirty(setShift)}
              options={[
                { label: 'Day', value: 'day' },
                { label: 'Night', value: 'night' },
                { label: 'Any', value: 'any' },
              ]}
            />
          </Section>
          {save.error ? (
            <Text variant="caption" tone="danger">
              {(save.error as Error).message}
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const hhmm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--');

export function DutyHistory() {
  const { data, isLoading, error, refetch } = useBookings(['completed', 'closed']);
  return (
    <Screen header={<Header title="Duty history" />}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyView title="No completed duties yet" body="Finished duties appear here with their start and end times." />
      ) : (
        <View style={{ gap: space.md }}>
          {data.items.map((b) => (
            <Card key={b.id} style={{ gap: 4 }}>
              <View style={styles.between}>
                <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                  {b.location.address}
                </Text>
                <Text variant="caption" tone="muted">
                  {new Date(b.startedAt ?? b.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text variant="label" tone="muted">
                {b.code}, started {hhmm(b.startedAt)}, finished {hhmm(b.completedAt)}
                {b.rating ? `, rated ${b.rating.stars}/5` : ''}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

export function Documents() {
  const { data, isLoading, error, refetch } = useMe();
  const docs = data?.user.documents ?? [];
  return (
    <Screen header={<Header title="Documents" />}>
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <View style={{ gap: space.md }}>
          {docs.length ? (
            docs.map((d) => (
              <Card key={d.id} style={styles.doc}>
                <FileCheck2 color={colors.blue} size={22} strokeWidth={1.75} />
                <Text variant="heading" style={{ flex: 1 }}>
                  {DOC_LABEL[d.kind] ?? d.kind}
                </Text>
                <Badge label={DOC_STATUS[d.status].label} tone={DOC_STATUS[d.status].tone} />
              </Card>
            ))
          ) : (
            <Text tone="muted">No documents on file yet.</Text>
          )}
          <Text variant="caption" tone="muted">
            Documents are uploaded and renewed by your company on the partner portal.
          </Text>
        </View>
      )}
    </Screen>
  );
}

export function MyCompany() {
  const { data, isLoading, error, refetch } = useMyCompany();
  const c = data?.company;
  return (
    <Screen header={<Header title="Your company" />}>
      {isLoading ? (
        <LoadingView />
      ) : error || !c ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <View style={styles.form}>
          <Card style={{ gap: space.md }}>
            <Building2 color={colors.blue} size={28} strokeWidth={1.75} />
            <Text variant="title">{c.name}</Text>
            {c.verified ? <Badge label="Verified My Captain partner" tone="green" /> : <Badge label="Not active" tone="amber" />}
            <View>
              {c.licence ? <DetailRow label="Licence" value={c.licence} /> : null}
              <DetailRow label="Supervisor" value={c.supervisor.name} />
              <DetailRow label="Office" value={c.office} />
            </View>
          </Card>
          <Button
            label="Call supervisor"
            variant="secondary"
            icon={<Phone color={colors.text} size={20} strokeWidth={1.75} />}
            onPress={() => Linking.openURL(`tel:${c.supervisor.phone}`)}
          />
          <Text variant="caption" tone="muted">
            Pay, leave and account changes are handled by your company.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  doc: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
