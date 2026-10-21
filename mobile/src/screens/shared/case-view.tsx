import { useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Badge, Card, ErrorView, Header, LoadingView, Screen, Section, Text } from '@/components/ui';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, caseTime } from '@/features/cases';
import { useCase } from '@/features/ops';
import { colors, radius, space } from '@/theme';

// A customer's or staff member's own case: what they reported and the team's public replies.
export function CaseView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useCase(id);
  const c = data?.case;

  return (
    <Screen header={<Header title={c ? c.ref : 'Case'} />}>
      {isLoading ? (
        <LoadingView />
      ) : error || !c ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <View style={styles.body}>
          <View style={styles.top}>
            <Text variant="title">{CASE_TYPE_LABEL[c.type]}</Text>
            <Badge label={CASE_STATUS_LABEL[c.status].label} tone={CASE_STATUS_LABEL[c.status].tone} />
          </View>
          {typeof c.booking === 'object' && c.booking ? (
            <Text tone="muted">Booking {c.booking.code}</Text>
          ) : null}
          <Card>
            <Text>{c.details}</Text>
          </Card>
          {c.resolution ? (
            <Card style={{ backgroundColor: colors.surface }}>
              <Text variant="label" tone="muted">
                Resolution
              </Text>
              <Text>{c.resolution}</Text>
            </Card>
          ) : null}
          {c.evidence.length ? (
            <Section title="Evidence">
              <View style={styles.photos}>
                {c.evidence.map((e) => (
                  <Image key={e.id} source={{ uri: e.url }} style={styles.photo} accessibilityLabel="Evidence photo" />
                ))}
              </View>
            </Section>
          ) : null}
          <Section title="Updates">
            {c.timeline.map((t, i) => (
              <View key={i} style={styles.row}>
                <Text variant="caption" tone="faint" style={styles.time}>
                  {caseTime(t.at)}
                </Text>
                <Text style={{ flex: 1 }}>{t.text}</Text>
              </View>
            ))}
          </Section>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surface },
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.xs },
  time: { width: 96 },
});
