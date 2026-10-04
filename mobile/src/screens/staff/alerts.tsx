import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, Text } from '@/components/ui';
import { guardAlerts } from '@/lib/mock-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

const toneLabel = { amber: 'Action needed', blue: 'Update', green: 'Done' };

export function StaffAlerts() {
  const r = useResponsive();
  // 1 column on phones, 2 on tablets, 3 on large screens.
  const cols = r.desktop ? 3 : r.tablet ? 2 : 1;
  const cardWidth = cols === 1 ? '100%' : r.columnWidth(cols, space.md);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, r.content]} showsVerticalScrollIndicator={false}>
        <Text variant="title">Alerts</Text>
        <View style={styles.grid}>
          {guardAlerts.map((a) => (
            <View key={a.id} style={{ width: cardWidth }}>
              <Card style={{ gap: space.sm }}>
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
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.md, paddingBottom: space.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
});