import { router } from 'expo-router';
import { Briefcase, CalendarClock, Car, MapPin, Shield } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyView, ErrorView, ListRow, LoadingView, Section, Text } from '@/components/ui';
import { useBookings } from '@/features/api';
import { durationText, serviceName, statusInfo, whenText } from '@/features/booking/labels';
import { useResponsive } from '@/lib/use-responsive';
import { useAuth } from '@/stores/auth';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

export function StaffJobs() {
  const r = useResponsive();
  const user = useAuth((s) => s.user);
  const isGuard = user?.role === 'guard';
  const { data, isLoading, error, refetch, isRefetching } = useBookings(['confirmed', 'arriving', 'on_duty']);
  const list = [...(data?.items ?? [])].sort((a, b) => a.startAt.localeCompare(b.startAt));
  // A duty in progress always comes first.
  const next = list.find((b) => b.status === 'on_duty' || b.status === 'arriving') ?? list[0];
  const later = list.filter((b) => b.id !== next?.id);
  const split = r.tablet;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, r.content, { gap: r.compact ? space.xl : space.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}>
        <View style={{ gap: 2 }}>
          <Text variant="label" tone="muted">
            Welcome, {user?.name.split(' ')[0]}
          </Text>
          <Text variant="title">{isGuard ? 'Your shifts' : 'Your jobs'}</Text>
        </View>

        {isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : !next ? (
          <EmptyView icon={Briefcase} title="No assignments yet" body="New jobs from your company appear here instantly." />
        ) : (
          <View style={[styles.body, split && styles.bodySplit]}>
            <Pressable onPress={() => router.push(`/assignment/${next.id}`)} style={split ? { flex: 1.2, minWidth: 0 } : undefined}>
              <View style={[styles.next, { padding: r.compact ? space.lg : space.xl }]}>
                <View style={styles.nextTop}>
                  <Badge label={statusInfo[next.status].label} tone={next.status === 'on_duty' ? 'green' : 'blue'} />
                  <Text variant="caption" style={{ color: '#B7C2D6' }}>
                    {next.code}
                  </Text>
                </View>
                <Text variant="title" tone="inverse">
                  {whenText(next.startAt)}
                </Text>
                <View style={{ gap: space.sm }}>
                  <Meta icon={CalendarClock} text={`${serviceName[next.service]}, ${durationText(next)}`} />
                  <Meta icon={MapPin} text={next.location.point ? `${next.location.point}, ${next.location.address}` : next.location.address} />
                  {next.vehicle ? <Meta icon={Car} text={`${next.vehicle.makeModel ?? next.vehicle.class}, ${next.vehicle.transmission}`} /> : null}
                </View>
                <Button label="Open job" variant="inverse" onPress={() => router.push(`/assignment/${next.id}`)} />
              </View>
            </Pressable>

            <View style={split ? { flex: 1, minWidth: 0 } : undefined}>
              <Section title="Upcoming">
                {later.length ? (
                  later.map((b) => (
                    <ListRow
                      key={b.id}
                      icon={isGuard ? Shield : Car}
                      title={whenText(b.startAt)}
                      subtitle={`${durationText(b)}, ${b.location.address}`}
                      onPress={() => router.push(`/assignment/${b.id}`)}
                    />
                  ))
                ) : (
                  <Text tone="muted">Nothing else scheduled.</Text>
                )}
              </Section>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <View style={styles.meta}>
      <Icon color="#B7C2D6" size={iconSize.sm} strokeWidth={iconStroke} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="label" style={{ color: colors.onPrimary }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxxl },
  body: { gap: space.xxl },
  bodySplit: { flexDirection: 'row', alignItems: 'flex-start' },
  next: { backgroundColor: colors.navy, borderRadius: radius.xl, gap: space.lg },
  nextTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
