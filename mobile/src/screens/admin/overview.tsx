import { router } from 'expo-router';
import { Activity } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { Badge, Card, EmptyView, ErrorView, LoadingView, Section, Text } from '@/components/ui';
import { useOverview } from '@/features/api';
import { bookingTitle, statusInfo, whenText } from '@/features/booking/labels';
import { formatPKR } from '@/features/booking/pricing';
import { useResponsive } from '@/lib/use-responsive';
import { colors, radius, space } from '@/theme';

import { SosPanel } from './sos-panel';

export function AdminOverview() {
  const r = useResponsive();
  const { data, isLoading, error, refetch, isRefetching } = useOverview();
  const kpiWidth = r.columnWidth(r.tablet ? 4 : 2, space.md);
  const k = data?.kpis;
  const tiles = k
    ? [
        { label: 'On duty now', value: String(k.activeDuties), color: colors.green, go: '/dispatch' as const },
        { label: 'Waiting to assign', value: String(k.awaitingAssignment), color: colors.amber, go: '/dispatch' as const },
        { label: 'Partner applications', value: String(k.pendingPartners), color: colors.blue, go: '/partners' as const },
        { label: 'Paid today', value: formatPKR(k.paidToday), color: colors.navy, go: undefined },
      ]
    : [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[r.content, styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.blue} />}>
        <View style={{ gap: 4 }}>
          <Text variant="title">Operations</Text>
          <Text tone="muted">Live bookings, assignments and partners</Text>
        </View>

        <SosPanel />

        {isLoading ? (
          <LoadingView />
        ) : error || !data ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : (
          <>
            <View style={styles.grid}>
              {tiles.map((t) => (
                <Pressable key={t.label} disabled={!t.go} onPress={() => t.go && router.push(t.go)} style={{ width: kpiWidth }}>
                  <View style={styles.kpi}>
                    <View style={[styles.kpiBar, { backgroundColor: t.color }]} />
                    <Text variant="caption" tone="muted">
                      {t.label}
                    </Text>
                    <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
                      {t.value}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={[styles.split, r.tablet && styles.splitRow]}>
              <View style={r.tablet ? { flex: 1.3, minWidth: 0 } : undefined}>
                <LiveMap height={r.tablet ? 360 : 220} target={KARACHI} />
              </View>
              <View style={r.tablet ? { flex: 1, minWidth: 0 } : undefined}>
                <Section title="Live and upcoming">
                  {data.live.length ? (
                    <Card style={{ paddingVertical: space.xs }}>
                      {data.live.map((b, i) => (
                        <Pressable
                          key={b.id}
                          onPress={() => router.push(`/dispatch/${b.id}`)}
                          style={({ pressed }) => [styles.op, i > 0 && styles.opBorder, pressed && { opacity: 0.6 }]}>
                          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                            <Text variant="heading" numberOfLines={1}>
                              {b.staff[0]?.name ?? bookingTitle(b)}
                            </Text>
                            <Text variant="label" tone="muted" numberOfLines={1}>
                              {b.code}, {whenText(b.startAt)}
                            </Text>
                          </View>
                          <Badge label={statusInfo[b.status].label} tone={statusInfo[b.status].tone} />
                        </Pressable>
                      ))}
                    </Card>
                  ) : (
                    <EmptyView icon={Activity} title="All quiet" body="Active duties appear here the moment they start." />
                  )}
                </Section>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.xl, paddingBottom: space.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  kpi: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, gap: 4, overflow: 'hidden' },
  kpiValue: { fontFamily: 'Manrope_700Bold', fontSize: 24, letterSpacing: -0.6, color: colors.text },
  kpiBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  split: { gap: space.xl },
  splitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  op: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  opBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
