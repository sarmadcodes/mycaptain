import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, DetailRow, Section, Text } from '@/components/ui';
import { formatPKR } from '@/features/booking/pricing';
import { earnings } from '@/lib/mock-data';
import { colors, radius, space } from '@/theme';

export function StaffEarnings() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Earnings</Text>
        <View style={styles.hero}>
          <Text variant="label" style={{ color: '#B7C2D6' }}>
            This week
          </Text>
          <Text style={styles.amount}>{formatPKR(earnings.week)}</Text>
          <View style={styles.stats}>
            <Text variant="label" tone="inverse">
              {earnings.duties} duties
            </Text>
            <Text variant="label" tone="inverse">
              {earnings.hours} hours
            </Text>
          </View>
        </View>
        <Section title="Recent duties">
          <Card style={{ gap: 0 }}>
            {earnings.recent.map((e) => (
              <DetailRow key={e.id} label={`${e.date}  ${e.label}`} value={formatPKR(e.amount)} />
            ))}
          </Card>
        </Section>
        <Text variant="caption" tone="muted">
          Payouts are made by My Captain every Monday. Customers pay in the app, never in cash.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xl },
  hero: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: space.xl, gap: space.sm },
  amount: { fontFamily: 'Manrope_700Bold', fontSize: 34, letterSpacing: -0.8, color: colors.onPrimary },
  stats: { flexDirection: 'row', gap: space.xl },
});
