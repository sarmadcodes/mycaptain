import { Siren } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useSosList, useSosStatus } from '@/features/ops';
import { ago } from '@/screens/staff/alerts';
import { colors, space } from '@/theme';
import type { SosApi } from '@/types/api';

// Open and acknowledged emergency alerts, pinned above everything else for operations.
export function SosPanel() {
  const { data } = useSosList();
  const update = useSosStatus();
  const active = (data?.items ?? []).filter((s) => s.status !== 'resolved');
  if (!active.length) return null;

  return (
    <View style={{ gap: space.sm }}>
      {active.map((s) => (
        <SosCard key={s.id} s={s} busy={update.isPending && update.variables?.id === s.id} onStatus={(status) => update.mutate({ id: s.id, status })} />
      ))}
    </View>
  );
}

function SosCard({ s, busy, onStatus }: { s: SosApi; busy: boolean; onStatus: (v: 'acknowledged' | 'resolved') => void }) {
  const who = typeof s.raisedBy === 'object' ? s.raisedBy : undefined;
  const booking = typeof s.booking === 'object' ? s.booking : undefined;
  const open = s.status === 'open';
  return (
    <Card style={[styles.card, open && styles.open]}>
      <View style={styles.row}>
        <Siren color={colors.red} size={24} strokeWidth={1.75} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">
            SOS from {who?.name ?? s.raisedByName ?? 'a user'} ({who?.role ?? 'user'})
          </Text>
          <Text variant="label" tone="muted">
            {booking ? `${booking.code}, ${booking.location.address}. ` : ''}
            {ago(s.createdAt)}
            {open ? ', not yet acknowledged' : ', acknowledged'}
          </Text>
          {s.note ? <Text>{s.note}</Text> : null}
        </View>
      </View>
      <View style={styles.row}>
        {who?.phone ? <Button label="Call" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${who.phone}`)} /> : null}
        {s.lat != null && s.lng != null ? (
          <Button
            label="Map"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`)}
          />
        ) : null}
        <Button label={open ? 'Acknowledge' : 'Resolve'} loading={busy} style={{ flex: 1 }} onPress={() => onStatus(open ? 'acknowledged' : 'resolved')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md, borderColor: colors.red },
  open: { backgroundColor: '#FCEBEC' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
});
