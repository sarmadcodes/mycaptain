import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { Building2, CircleAlert, ExternalLink, FileCheck2 } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  DetailRow,
  EmptyView,
  ErrorView,
  Header,
  LoadingView,
  Screen,
  Section,
  Segmented,
  Text,
  TextField,
} from '@/components/ui';
import { useCompanies, useCompany, useReviewCompany } from '@/features/api';
import { useResponsive } from '@/lib/use-responsive';
import { errorMessage } from '@/services/api/client';
import { colors, space } from '@/theme';
import type { CompanyApi } from '@/types/api';

const statusTone = { pending: 'amber', changes_requested: 'red', approved: 'green', rejected: 'neutral', suspended: 'red' } as const;
const statusLabel = { pending: 'Pending review', changes_requested: 'Changes requested', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended' };
const docLabel: Record<string, string> = { registration: 'Registration certificate', ntn: 'NTN certificate', security_licence: 'Security licence', other: 'Other document' };

export function AdminPartners() {
  const r = useResponsive();
  const [tab, setTab] = useState<'pending' | 'approved' | 'changes_requested'>('pending');
  const { data, isLoading, error, refetch, isRefetching } = useCompanies(tab);
  const w = r.tablet ? r.columnWidth(2, space.md) : '100%';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[r.content, styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}>
        <View style={{ gap: 4 }}>
          <Text variant="title">Partners</Text>
          <Text tone="muted">Company applications from the partner website</Text>
        </View>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: 'To review', value: 'pending' },
            { label: 'Changes asked', value: 'changes_requested' },
            { label: 'Approved', value: 'approved' },
          ]}
        />
        {isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : !data?.items.length ? (
          <EmptyView icon={Building2} title="No companies here" body="New applications arrive here live." />
        ) : (
          <View style={styles.grid}>
            {data.items.map((c) => (
              <View key={c.id} style={{ width: w }}>
                <CompanyCard c={c} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CompanyCard({ c }: { c: CompanyApi }) {
  return (
    <Pressable onPress={() => router.push(`/partners/${c.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: space.sm }, pressed && { opacity: 0.85 }]}>
          <View style={styles.between}>
            <Badge label={statusLabel[c.status]} tone={statusTone[c.status]} />
            <Text variant="caption" tone="muted">
              {dayjs(c.createdAt).format('D MMM')}
            </Text>
          </View>
          <Text variant="heading">{c.tradingName || c.legalName}</Text>
          <Text variant="label" tone="muted">
            {c.city}, {c.services.join(', ')}
          </Text>
          <Text variant="caption" tone="faint">
            {c.ref}, {c.documents.length} documents
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

export function PartnerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useCompany(id);
  const review = useReviewCompany(id);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string>();

  if (isLoading) return <Screen header={<Header />}><LoadingView /></Screen>;
  if (error || !data) return <Screen header={<Header />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  const c = data.company;

  const decide = async (decision: 'approve' | 'request_changes' | 'reject' | 'suspend') => {
    setActionError(undefined);
    try {
      await review.mutateAsync({ decision, note: note.trim() || undefined });
      setNote('');
      refetch();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  const reviewable = c.status === 'pending' || c.status === 'changes_requested';

  return (
    <Screen
      header={<Header title={c.ref} />}
      footer={
        reviewable ? (
          <Button label="Approve company" loading={review.isPending} onPress={() => decide('approve')} />
        ) : c.status === 'approved' ? (
          <Button label="Suspend company" variant="secondary" disabled={note.trim().length < 3} onPress={() => decide('suspend')} />
        ) : null
      }>
      <View style={{ gap: space.xl }}>
        <View style={{ gap: space.sm }}>
          <Badge label={statusLabel[c.status]} tone={statusTone[c.status]} />
          <Text variant="title">{c.tradingName || c.legalName}</Text>
          {c.reviewNote ? <Text tone="muted">Last note: {c.reviewNote}</Text> : null}
        </View>
        <Card style={{ gap: 0 }}>
          <DetailRow label="Legal name" value={c.legalName} />
          <DetailRow label="Head office" value={`${c.address}, ${c.city}`} />
          <DetailRow label="Services" value={c.services.join(', ')} />
          <DetailRow label="Cities" value={c.cities.join(', ')} />
          {c.driverCount ? <DetailRow label="Drivers" value={String(c.driverCount)} /> : null}
          {c.guardCount ? <DetailRow label="Guards" value={String(c.guardCount)} /> : null}
          {c.securityLicence ? (
            <DetailRow label="Licence" value={`${c.securityLicence.number}, expires ${dayjs(c.securityLicence.expiry).format('MMM YYYY')}`} />
          ) : null}
          <DetailRow label="Contact" value={`${c.contact.name}, ${c.contact.designation}`} />
          <DetailRow label="Phone" value={c.contact.phone} />
          <DetailRow label="Email" value={c.contact.email} />
          <DetailRow label="Staff on app" value={String(data.staffCount)} />
        </Card>

        <Section title="Documents">
          {c.documents.length ? (
            c.documents.map((d) => (
              <Pressable key={d.id} disabled={!d.viewUrl} onPress={() => d.viewUrl && Linking.openURL(d.viewUrl)}>
                <Card style={styles.doc}>
                  {d.status === 'rejected' ? (
                    <CircleAlert color={colors.red} size={20} strokeWidth={1.75} />
                  ) : (
                    <FileCheck2 color={d.status === 'verified' ? colors.green : colors.blue} size={20} strokeWidth={1.75} />
                  )}
                  <Text variant="heading" style={{ flex: 1 }}>
                    {docLabel[d.kind] ?? d.kind}
                  </Text>
                  {d.viewUrl ? <ExternalLink color={colors.textMuted} size={18} strokeWidth={1.75} /> : null}
                </Card>
              </Pressable>
            ))
          ) : (
            <Text tone="muted">No documents uploaded yet.</Text>
          )}
        </Section>

        {reviewable || c.status === 'approved' ? (
          <Section title={reviewable ? 'Or send back' : 'Suspend'}>
            <TextField
              label="Note to the company"
              value={note}
              onChangeText={setNote}
              placeholder={reviewable ? 'What needs to change' : 'Reason for suspension'}
              multiline
              style={{ minHeight: 70, paddingTop: 14, textAlignVertical: 'top' }}
            />
            {reviewable ? (
              <View style={styles.row}>
                <Button label="Request changes" variant="secondary" style={{ flex: 1 }} disabled={note.trim().length < 3} onPress={() => decide('request_changes')} />
                <Button label="Reject" variant="ghost" style={{ flex: 1 }} disabled={note.trim().length < 3} onPress={() => decide('reject')} />
              </View>
            ) : null}
          </Section>
        ) : null}

        {actionError ? (
          <Text variant="caption" tone="danger">
            {actionError}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.xl, paddingBottom: space.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  doc: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
});
