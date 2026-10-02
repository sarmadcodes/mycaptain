import { router } from 'expo-router';
import { AlertTriangle, Coffee, MapPin, Radio } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { Badge, Button, Card, DetailRow, ListRow, Text } from '@/components/ui';
import { driverAssignments, guardAssignments } from '@/lib/mock-data';
import { useAuth } from '@/stores/auth';
import { colors, iconSize, iconStroke, space } from '@/theme';

type Phase = 'ready' | 'arrived' | 'on_duty' | 'finished';

const clock = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');

// TODO(backend): phase changes go to the API; location streams over the socket while on duty.
export function StaffDuty() {
  const isGuard = useAuth((s) => s.user?.role === 'guard');
  const a = (isGuard ? guardAssignments : driverAssignments)[0];
  const [phase, setPhase] = useState<Phase>('ready');
  const [onBreak, setOnBreak] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [lastCheck, setLastCheck] = useState<string>();

  useEffect(() => {
    if (phase !== 'on_duty' || onBreak) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, onBreak]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Text variant="title">Duty</Text>
          <Badge
            label={phase === 'on_duty' ? (onBreak ? 'On break' : 'On duty') : phase === 'finished' ? 'Finished' : 'Not started'}
            tone={phase === 'on_duty' ? (onBreak ? 'amber' : 'green') : 'neutral'}
          />
        </View>

        <LiveMap height={200} target={KARACHI} staff={phase === 'on_duty' ? KARACHI : undefined} geofenceMeters={isGuard ? 60 : undefined} />

        {phase === 'on_duty' ? (
          <View style={styles.timer}>
            <Text variant="caption" tone="muted">
              Time on duty
            </Text>
            <Text style={styles.time}>{clock(seconds)}</Text>
            <View style={styles.sharing}>
              <Radio color={colors.green} size={iconSize.sm} strokeWidth={iconStroke} />
              <Text variant="label" style={{ color: colors.green }}>
                Sharing location with operations
              </Text>
            </View>
          </View>
        ) : null}

        <Card style={{ gap: 0 }}>
          <DetailRow label="Assignment" value={a.id} />
          <DetailRow label={isGuard ? 'Post' : 'Pickup'} value={a.location} />
          <DetailRow label="Duration" value={a.duration} />
          {isGuard ? <DetailRow label="Last check-in" value={lastCheck ?? 'Not yet'} /> : null}
        </Card>

        {phase === 'ready' ? (
          <>
            <Text variant="label" tone="muted">
              Location sharing starts when you check in and stops when you finish.
            </Text>
            <Button
              label={isGuard ? 'I am at my post' : 'I have arrived'}
              icon={<MapPin color={colors.onPrimary} size={iconSize.md} strokeWidth={iconStroke} />}
              onPress={() => setPhase('arrived')}
            />
          </>
        ) : null}

        {phase === 'arrived' ? (
          <Button
            label={isGuard ? 'Check in and start shift' : 'Confirm vehicle handover and start'}
            onPress={() => {
              setPhase('on_duty');
              setLastCheck(now());
            }}
          />
        ) : null}

        {phase === 'on_duty' ? (
          <View style={{ gap: space.md }}>
            {isGuard ? <Button label="Complete scheduled check-in" variant="secondary" onPress={() => setLastCheck(now())} /> : null}
            <Button
              label={onBreak ? 'End break' : 'Start break'}
              variant="secondary"
              icon={<Coffee color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />}
              onPress={() => setOnBreak((b) => !b)}
            />
            <Button label="Finish duty" onPress={() => setPhase('finished')} />
          </View>
        ) : null}

        {phase === 'finished' ? (
          <Card tinted style={{ gap: space.sm }}>
            <Text variant="heading">Duty complete</Text>
            <Text variant="label" tone="muted">
              {clock(seconds)} recorded. Your duty report has been sent to operations.
            </Text>
          </Card>
        ) : null}

        <ListRow icon={AlertTriangle} title="Report a problem" subtitle="Accident, breakdown or urgent help" onPress={() => router.push('/incident')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xl },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { alignItems: 'center', gap: 4 },
  time: { fontFamily: 'Manrope_700Bold', fontSize: 44, letterSpacing: -1, color: colors.text, fontVariant: ['tabular-nums'] },
  sharing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
