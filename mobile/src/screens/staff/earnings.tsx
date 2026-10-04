import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, DetailRow, Section, Text } from '@/components/ui';
import { formatPKR } from '@/features/booking/pricing';
import { earnings } from '@/lib/mock-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, radius, space } from '@/theme';

export function StaffEarnings() {
  const r = useResponsive();
  const split = r.tablet;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, r.content]} showsVerticalScrollIndicator={false}>
        <Text variant="title">Earnings</Text>

        <View style={[styles.body, split && styles.bodySplit]}>
          <View style={[styles.hero, { padding: r.compact ? space.lg : space.xl }, split && styles.col]}>
            <Text variant="label" style={{ color: '#B7C2D6' }}>
              This week
            </Text>
            <Text style={[styles.amount, { fontSize: r.compact ? 28 : r.tablet ? 40 : 34 }]}>
              {formatPKR(earnings.week)}
            </Text>
            <View style={styles.stats}>
              <Text variant="label" tone="inverse">
                {earnings.duties} duties
              </Text>
              <Text variant="label" tone="inverse">
                {earnings.hours} hours
              </Text>
            </View>
          </View>

          <View style={split ? styles.col : undefined}>
            <Section title="Recent duties">
              <Card style={{ gap: 0 }}>
                {earnings.recent.map((e) => (
                  <DetailRow key={e.id} label={`${e.date}  ${e.label}`} value={formatPKR(e.amount)} />
                ))}
              </Card>
            </Section>
          </View>
        </View>

        <Text variant="caption" tone="muted">
          Payouts are made by My Captain every Monday. Customers pay in the app, never in cash.
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