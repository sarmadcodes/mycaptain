import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { Badge, Card, Section, Text } from '@/components/ui';
import { kpis, liveOps } from '@/lib/admin-data';
import { useResponsive } from '@/lib/use-responsive';
import { colors, radius, space } from '@/theme';

import { AdminPage } from './page';

export function AdminOverview() {
  const r = useResponsive();
  const kpiCols = r.tablet ? 4 : 2;
  const kpiWidth = r.columnWidth(kpiCols, space.md);
  const alerts = liveOps.filter((o) => o.tone === 'red' || o.tone === 'amber');

  return (
    <AdminPage title="Operations" subtitle="Live view of drivers and security across Karachi">
      <View style={styles.grid}>
        {kpis.map((k) => (
          <View key={k.label} style={[styles.kpi, { width: kpiWidth }]}>
            <Text variant="caption" tone="muted">
              {k.label}
            </Text>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <View style={[styles.kpiBar, { backgroundColor: toneColor[k.tone] }]} />
          </View>
        ))}
      </View>

      <View style={[styles.split, r.tablet && styles.splitRow]}>
        <View style={r.tablet ? { flex: 1.3, minWidth: 0 } : undefined}>
          <LiveMap
            height={r.tablet ? 360 : 220}
            target={KARACHI}
            staff={{ latitude: KARACHI.latitude + 0.005, longitude: KARACHI.longitude + 0.004 }}
          />
        </View>
        <View style={r.tablet ? { flex: 1, minWidth: 0 } : undefined}>
          <Section title={`Needs attention (${alerts.length})`}>
            {alerts.map((o) => (
              <Card key={o.id} style={styles.alert}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text variant="heading">{o.who}</Text>
                  <Text variant="label" tone="muted">
                    {o.note}, {o.id}
                  </Text>
                </View>
                <Badge label={o.status} tone={o.tone} />
              </Card>
            ))}
          </Section>
        </View>
      </View>

      <Section title="Live duties" action={{ label: 'Dispatch', onPress: () => router.push('/dispatch') }}>
        <Card style={{ paddingVertical: space.xs }}>
          {liveOps.map((o, i) => (
            <Pressable key={o.id} style={[styles.op, i > 0 && styles.opBorder]} accessibilityRole="button">
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="heading">{o.who}</Text>
                <Text variant="label" tone="muted" numberOfLines={1}>
                  {o.what}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label={o.status} tone={o.tone} />
                <Text variant="caption" tone="faint">
                  {o.id}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      </Section>
    </AdminPage>
  );
}

const toneColor = { green: colors.green, blue: colors.blue, red: colors.red, amber: colors.amber, neutral: colors.navy };

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  kpi: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, gap: 4, overflow: 'hidden' },
  kpiValue: { fontFamily: 'Manrope_700Bold', fontSize: 26, letterSpacing: -0.6, color: colors.text },
  kpiBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  split: { gap: space.xl },
  splitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  op: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  opBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
