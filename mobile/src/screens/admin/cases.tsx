import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, DetailRow, EmptyView, ErrorView, Header, LoadingView, Screen, Section, Segmented, Text, TextField } from '@/components/ui';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, caseTime } from '@/features/cases';
import { useCase, useCases, useUpdateCase } from '@/features/ops';
import { useResponsive } from '@/lib/use-responsive';
import { colors, radius, space } from '@/theme';
import type { CaseApi } from '@/types/api';

import { AdminPage } from './page';

const nameOf = (x: { name: string } | string | undefined) => (typeof x === 'object' && x ? x.name : undefined);

export function AdminCases() {
  const r = useResponsive();
  const [tab, setTab] = useState<'active' | 'resolved'>('active');
  const { data, isLoading, error, refetch } = useCases();
  const list = (data?.items ?? []).filter((c) => (tab === 'active' ? c.status !== 'resolved' : c.status === 'resolved'));
  const w = r.tablet ? r.columnWidth(2, space.md) : '100%';

  return (
    <AdminPage title="Cases" subtitle="Accidents, complaints, incidents and replacements">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { label: 'Open', value: 'active' },
          { label: 'Resolved', value: 'resolved' },
        ]}
      />
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : !list.length ? (
        <EmptyView title={tab === 'active' ? 'No open cases' : 'No resolved cases yet'} body="New reports appear here instantly." />
      ) : (
        <View style={styles.grid}>
          {list.map((c) => (
            <View key={c.id} style={{ width: w }}>
              <CaseCard c={c} />
            </View>
          ))}
        </View>
      )}
    </AdminPage>
  );
}

function CaseCard({ c }: { c: CaseApi }) {
  const s = CASE_STATUS_LABEL[c.status];
  return (
    <Pressable onPress={() => router.push(`/cases/${c.id}` as Href)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.between}>
            <View style={styles.badges}>
              <Badge label={CASE_TYPE_LABEL[c.type]} tone="blue" />
              {c.urgent ? <Badge label="Urgent" tone="red" /> : null}
            </View>
            <Badge label={s.label} tone={c.status === 'open' ? 'red' : s.tone} />
          </View>
          <Text variant="heading">
            {c.ref}
            {typeof c.booking === 'object' && c.booking ? `, booking ${c.booking.code}` : ''}
          </Text>
          <Text variant="label" tone="muted" numberOfLines={2}>
            {c.details}
          </Text>
          <Text variant="caption" tone="faint">
            Opened {caseTime(c.createdAt)} by {nameOf(c.openedBy) ?? c.openedByRole}
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

export function CaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useCase(id);
  const update = useUpdateCase(id);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');

  const c = data?.case;
  if (isLoading || error || !c) {
    return <Screen header={<Header />}>{isLoading ? <LoadingView /> : <ErrorView error={error} onRetry={refetch} />}</Screen>;
  }

  const booking = typeof c.booking === 'object' ? c.booking : undefined;
  const opener = typeof c.openedBy === 'object' ? c.openedBy : undefined;
  const s = CASE_STATUS_LABEL[c.status];

  return (
    <Screen
      header={<Header title={c.ref} />}
      footer={
        c.status === 'resolved' ? (
          <Button label="Reopen case" variant="secondary" loading={update.isPending} onPress={() => update.mutate({ status: 'in_progress' })} />
        ) : (
          <Button
            label="Mark resolved"
            loading={update.isPending}
            disabled={!resolution.trim() && !c.resolution}
            onPress={() => update.mutate({ status: 'resolved', resolution: resolution.trim() || undefined }, { onSuccess: () => setResolution('') })}
          />
        )
      }>
      <View style={{ gap: space.xl }}>
        <View style={styles.badges}>
          <Badge label={CASE_TYPE_LABEL[c.type]} tone="blue" />
          <Badge label={s.label} tone={c.status === 'open' ? 'red' : s.tone} />
          {c.urgent ? <Badge label="Urgent" tone="red" /> : null}
        </View>
        <Text>{c.details}</Text>
        <Card style={{ gap: 0 }}>
          <DetailRow label="Booking" value={booking?.code ?? 'None'} />
          <DetailRow label="Reported by" value={`${opener?.name ?? 'Unknown'} (${c.openedByRole})`} />
          {booking?.customer ? <DetailRow label="Customer" value={booking.customer.name} /> : null}
          {booking?.staff?.length ? <DetailRow label="Staff" value={booking.staff.map((x) => x.name).join(', ')} /> : null}
          <DetailRow label="Opened" value={caseTime(c.createdAt)} />
        </Card>

        <View style={styles.actions}>
          {c.status === 'open' ? (
            <Button label="Start handling" variant="secondary" loading={update.isPending} onPress={() => update.mutate({ status: 'in_progress' })} />
          ) : null}
          {opener?.phone ? (
            <Button label={`Call ${opener.name.split(' ')[0]}`} variant="secondary" onPress={() => Linking.openURL(`tel:${opener.phone}`)} />
          ) : null}
        </View>

        {c.evidence.length ? (
          <Section title="Evidence">
            <View style={styles.badges}>
              {c.evidence.map((e) => (
                <Pressable key={e.id} onPress={() => Linking.openURL(e.url)} accessibilityLabel="Open evidence">
                  <Image source={{ uri: e.url }} style={styles.photo} />
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Timeline">
          {c.timeline.map((t, i) => (
            <View key={i} style={styles.timeRow}>
              <View style={[styles.dot, t.internal && { backgroundColor: colors.textFaint }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body">{t.internal ? `Note: ${t.text}` : t.text}</Text>
                <Text variant="caption" tone="faint">
                  {caseTime(t.at)}
                  {t.internal ? ', internal' : ''}
                </Text>
              </View>
            </View>
          ))}
        </Section>

        {update.error ? (
          <Text variant="caption" tone="danger">
            {(update.error as Error).message}
          </Text>
        ) : null}

        <TextField
          label="Reply to reporter"
          placeholder="They see this in the app"
          value={reply}
          onChangeText={setReply}
          returnKeyType="send"
          onSubmitEditing={() => reply.trim() && update.mutate({ reply: reply.trim() }, { onSuccess: () => setReply('') })}
          hint="Press return to send."
        />
        <TextField
          label="Internal note"
          placeholder="Visible to operations only"
          value={note}
          onChangeText={setNote}
          returnKeyType="done"
          onSubmitEditing={() => note.trim() && update.mutate({ note: note.trim() }, { onSuccess: () => setNote('') })}
          hint="Press return to add it to the timeline."
        />
        {c.status !== 'resolved' ? (
          <TextField
            label="Resolution"
            placeholder="What was done, e.g. replacement assigned, PKR 500 credit"
            value={resolution}
            onChangeText={setResolution}
            hint="Required to mark the case resolved. The reporter sees it."
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actions: { gap: space.sm },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surface },
  timeRow: { flexDirection: 'row', gap: space.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 7 },
});
