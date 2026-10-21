import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useState } from 'react';

import { Card, DetailRow, ErrorView, LoadingView, Section, Segmented, Text } from '@/components/ui';
import { formatPKR } from '@/features/booking/pricing';
import { useEarnings } from '@/features/ops';
import { useResponsive } from '@/lib/use-responsive';
import { colors, radius, space } from '@/theme';

export function StaffEarnings() {
  const r = useResponsive();
  const split = r.tablet;
  const [period, setPeriod] = useState<'7' | '30'>('7');
  const days = Number(period);
  const { data: earnings, isLoading, error, refetch } = useEarnings(days);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, r.content]} showsVerticalScrollIndicator={false}>
        <Text variant="title">Earnings</Text>
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { label: 'Last 7 days', value: '7' },
            { label: 'Last 30 days', value: '30' },
          ]}
        />

        {isLoading ? (
          <LoadingView />
        ) : error || !earnings ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : (
        <View style={[styles.body, split && styles.bodySplit]}>
          <View style={[styles.hero, { padding: r.compact ? space.lg : space.xl }, split && styles.col]}>
            <Text variant="label" style={{ color: '#B7C2D6' }}>
              Duty value, last {days} days
            </Text>
            <Text style={[styles.amount, { fontSize: r.compact ? 28 : r.tablet ? 40 : 34 }]}>{formatPKR(earnings.total)}</Text>
            <View style={styles.stats}>
              <Text variant="label" tone="inverse">
                {earnings.duties} duties
              </Text>
              <Text variant="label" tone="inverse">
                {earnings.hours} hours
              </Text>
              {earnings.rating ? (
                <Text variant="label" tone="inverse">
                  {earnings.rating} average rating
                </Text>
              ) : null}
            </View>
          </View>

          <View style={split ? styles.col : undefined}>
            <Section title="Recent duties">
              {earnings.recent.length ? (
                <Card style={{ gap: 0 }}>
                  {earnings.recent.map((e) => (
                    <DetailRow
                      key={e.id}
                      label={`${new Date(e.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}  ${e.code}, ${e.hours} h`}
                      value={formatPKR(e.amount)}
                    />
                  ))}
                </Card>
              ) : (
                <Text tone="muted">No completed duties in this period.</Text>
              )}
            </Section>
          </View>
        </View>
        )}

        <Text variant="caption" tone="muted">
          The value of the duties you completed, shared equally when several staff work one booking. Your company pays your
          salary. Customers pay in the app, never in cash.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.xl, paddingBottom: space.xxxl },
  body: { gap: space.xl },
  bodySplit: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xxl },
  col: { flex: 1, minWidth: 0 },
  hero: { backgroundColor: colors.navy, borderRadius: radius.xl, gap: space.sm },
  amount: { fontFamily: 'Manrope_700Bold', letterSpacing: -0.8, color: colors.onPrimary },
  stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.xs },
});
