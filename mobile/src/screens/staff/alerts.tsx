import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, EmptyView, ErrorView, LoadingView, Text } from '@/components/ui';
import { useMarkRead, useNotifications } from '@/features/ops';
import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';
import type { NotificationApi } from '@/types/api';

const toneLabel = { amber: 'Action needed', blue: 'Update', green: 'Done', red: 'Urgent' };

export function ago(iso: string) {
  const m = Math.round((Date.now() - +new Date(iso)) / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return h < 48 ? 'Yesterday' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Screen to open for a notification. Staff open their assignment; chats and cases have their own screens.
function target(n: NotificationApi): Href | null {
  if (!n.link) return null;
  if (n.link.kind === 'booking') return `/assignment/${n.link.id}` as Href;
  return null;
}

export function StaffAlerts() {
  const r = useResponsive();
  const { data, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkRead();
  // 1 column on phones, 2 on tablets, 3 on large screens.
  const cols = r.desktop ? 3 : r.tablet ? 2 : 1;
  const cardWidth = cols === 1 ? '100%' : r.columnWidth(cols, space.md);

  // Opening the screen marks everything as read.
  useFocusEffect(
    useCallback(() => {
      if (data?.unread) markRead.mutate(undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.unread]),
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, r.content]} showsVerticalScrollIndicator={false}>
        <Text variant="title">Alerts</Text>
        {isLoading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : !data?.items.length ? (
          <EmptyView title="No alerts" body="New duties, messages and updates from operations appear here." />
        ) : (
          <View style={styles.grid}>
            {data.items.map((a) => {
              const to = target(a);
              return (
                <Pressable key={a.id} style={{ width: cardWidth }} disabled={!to} onPress={() => to && router.push(to)}>
                  <Card style={[{ gap: space.sm }, !a.readAt && styles.unread]}>
                    <View style={styles.top}>
                      <Badge label={toneLabel[a.tone]} tone={a.tone} />
                      <Text variant="caption" tone="muted">
                        {ago(a.createdAt)}
                      </Text>
                    </View>
                    <Text variant="heading">{a.title}</Text>
                    <Text variant="label" tone="muted">
                      {a.body}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.md, paddingBottom: space.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  unread: { borderColor: colors.blue },
});
