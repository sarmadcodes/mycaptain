import { router } from 'expo-router';
import { CalendarClock, Car, MapPin, Shield } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, ListRow, Section, Text } from '@/components/ui';
import { driverAssignments, guardAssignments } from '@/lib/mock-data';
import { useAuth } from '@/stores/auth';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

export function StaffJobs() {
  const user = useAuth((s) => s.user);
  const isGuard = user?.role === 'guard';
  const list = isGuard ? guardAssignments : driverAssignments;
  const [next, ...later] = list;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: 2 }}>
          <Text variant="label" tone="muted">
            Welcome, {user?.name.split(' ')[0]}
          </Text>
          <Text variant="title">{isGuard ? 'Your shifts' : 'Your jobs'}</Text>
        </View>

        {next ? (
          <Pressable onPress={() => router.push(`/assignment/${next.id}`)}>
            <View style={styles.next}>
              <View style={styles.nextTop}>
                <Badge label={next.status === 'new' ? 'New assignment' : 'Confirmed'} tone="blue" />
                <Text variant="caption" style={{ color: '#B7C2D6' }}>
                  {next.id}
                </Text>
              </View>
              <Text variant="title" tone="inverse">
                {next.when}
              </Text>
              <View style={{ gap: space.sm }}>
                <Meta icon={CalendarClock} text={next.duration} />
                <Meta icon={MapPin} text={next.location} />
                <Meta icon={isGuard ? Shield : Car} text={next.detail} />
              </View>
              <Button label="View details" variant="inverse" onPress={() => router.push(`/assignment/${next.id}`)} />
            </View>
          </Pressable>
        ) : null}

        <Section title="Upcoming">
          {later.map((a) => (
            <ListRow
              key={a.id}
              icon={isGuard ? Shield : Car}
              title={a.when}
              subtitle={`${a.duration}, ${a.location}`}
              onPress={() => router.push(`/assignment/${a.id}`)}
            />
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <View style={styles.meta}>
      <Icon color="#B7C2D6" size={iconSize.sm} strokeWidth={iconStroke} />
      <Text variant="label" style={{ color: colors.onPrimary }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xxl },
  next: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: space.xl, gap: space.lg },
  nextTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
