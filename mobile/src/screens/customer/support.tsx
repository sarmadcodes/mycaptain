import { router } from 'expo-router';
import { AlertTriangle, MessageSquareWarning, Phone, RefreshCw } from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, ListRow, Section, Text } from '@/components/ui';
import { cases } from '@/lib/mock-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

export function CustomerSupport() {
  const r = useResponsive();
  // Tablets: actions on the left, cases on the right. Phones: stacked.
  const split = r.tablet;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, r.content, { gap: r.compact ? space.xl : space.xxl }]}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: space.sm }}>
          <Text variant="title">Support</Text>
          <Text tone="muted">Accidents, complaints and staff changes, handled by our operations team.</Text>
        </View>

        <View style={[styles.body, split && styles.bodySplit, { gap: split ? space.xxl : r.compact ? space.xl : space.xxl }]}>
          <View style={split ? styles.col : undefined}>
            <ListRow
              icon={AlertTriangle}
              title="Report an accident"
              subtitle="Urgent incidents during a duty"
              onPress={() => router.push({ pathname: '/case/new', params: { type: 'accident' } })}
            />
            <ListRow
              icon={MessageSquareWarning}
              title="Make a complaint"
              subtitle="About a booking or staff member"
              onPress={() => router.push({ pathname: '/case/new', params: { type: 'complaint' } })}
            />
            <ListRow
              icon={RefreshCw}
              title="Replace staff"
              subtitle="For one shift or permanently"
              onPress={() => router.push({ pathname: '/case/new', params: { type: 'replacement' } })}
            />
            <ListRow
              icon={Phone}
              title="Call operations"
              subtitle="Available 24 hours"
              onPress={() => Linking.openURL('tel:+922100000000')}
            />
          </View>

          <View style={split ? styles.col : undefined}>
            <Section title="Your cases">
              {cases.map((c) => (
                <Card key={c.id} style={styles.case}>
                  <View style={styles.caseText}>
                    <Text variant="heading">{c.type}</Text>
                    <Text variant="label" tone="muted">
                      {c.id}, booking {c.booking}
                    </Text>
                  </View>
                  <Badge label={c.status} tone={c.tone} />
                </Card>
              ))}
            </Section>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxxl },
  body: {},
  bodySplit: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0 },
  case: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  caseText: { flex: 1, minWidth: 0, gap: 2 },
});