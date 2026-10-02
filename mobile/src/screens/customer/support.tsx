import { router } from 'expo-router';
import { AlertTriangle, MessageSquareWarning, Phone, RefreshCw } from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, ListRow, Section, Text } from '@/components/ui';
import { cases } from '@/lib/mock-data';
import { colors, space } from '@/theme';

export function CustomerSupport() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: space.sm }}>
          <Text variant="title">Support</Text>
          <Text tone="muted">Accidents, complaints and staff changes, handled by our operations team.</Text>
        </View>

        <View>
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

        <Section title="Your cases">
          {cases.map((c) => (
            <Card key={c.id} style={styles.case}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="heading">{c.type}</Text>
                <Text variant="label" tone="muted">
                  {c.id}, booking {c.booking}
                </Text>
              </View>
              <Badge label={c.status} tone={c.tone} />
            </Card>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xxl },
  case: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
