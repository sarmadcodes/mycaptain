import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, Text } from '@/components/ui';
import { guardAlerts } from '@/lib/mock-data';
import { colors, space } from '@/theme';

const toneLabel = { amber: 'Action needed', blue: 'Update', green: 'Done' };

export function StaffAlerts() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Alerts</Text>
        {guardAlerts.map((a) => (
          <Card key={a.id} style={{ gap: space.sm }}>
            <View style={styles.top}>
              <Badge label={toneLabel[a.tone]} tone={a.tone} />
              <Text variant="caption" tone="muted">
                {a.time}
              </Text>
            </View>
            <Text variant="heading">{a.title}</Text>
            <Text variant="label" tone="muted">
              {a.body}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
