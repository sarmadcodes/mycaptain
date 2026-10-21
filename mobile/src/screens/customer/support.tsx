import { router, type Href } from 'expo-router';
import { AlertTriangle, MessageSquareWarning, Phone, RefreshCw } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, ErrorView, ListRow, LoadingView, Section, Text } from '@/components/ui';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL } from '@/features/cases';
import { useCases } from '@/features/ops';
import { SUPPORT_PHONE } from '@/lib/config';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

export function CustomerSupport() {
  const r = useResponsive();
  // Tablets: actions on the left, cases on the right. Phones: stacked.
  const split = r.tablet;
  const cases = useCases();

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
              onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
            />
          </View>

          <View style={split ? styles.col : undefined}>
            <Section title="Your cases">
              {cases.isLoading ? (
                <LoadingView />
              ) : cases.error ? (
                <ErrorView error={cases.error} onRetry={cases.refetch} />
              ) : !cases.data?.items.length ? (
                <Text tone="muted">No cases yet. Anything you report appears here with updates from our team.</Text>
              ) : (
                cases.data.items.map((c) => (
                  <Pressable key={c.id} onPress={() => router.push(`/case/${c.id}` as Href)} accessibilityRole="button">
                    <Card style={styles.case}>
                      <View style={styles.caseText}>
                        <Text variant="heading">{CASE_TYPE_LABEL[c.type]}</Text>
                        <Text variant="label" tone="muted">
                          {c.ref}
                          {typeof c.booking === 'object' && c.booking ? `, booking ${c.booking.code}` : ''}
                        </Text>
                      </View>
                      <Badge label={CASE_STATUS_LABEL[c.status].label} tone={CASE_STATUS_LABEL[c.status].tone} />
                    </Card>
                  </Pressable>
                ))
              )}
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
