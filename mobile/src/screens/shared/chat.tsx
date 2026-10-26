import { useLocalSearchParams } from 'expo-router';
import { SendHorizontal } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView, Header, LoadingView, Text } from '@/components/ui';
import { useBooking } from '@/features/api';
import { useMessages, useSendMessage } from '@/features/ops';
import { useResponsive } from '@/lib/use-responsive';
import { useWatchBooking } from '@/services/socket';
import { useAuth } from '@/stores/auth';
import type { ChatMessage } from '@/types/api';
import { colors, fonts, iconSize, iconStroke, radius, space } from '@/theme';

const quickReplies = {
  customer: ['I am at the gate', 'Please come to the main entrance', 'Where are you now?', 'Thank you'],
  staff: ['I am on my way', 'I have arrived', 'Please wait 5 minutes', 'Thank you'],
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Booking chat between customer and assigned staff. Numbers stay private.
export function Chat({ asStaff = false }: { asStaff?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tablet } = useResponsive();
  const myId = useAuth((s) => s.user?.id);
  const booking = useBooking(id);
  const thread = useMessages(id);
  const sendMsg = useSendMessage(id);
  useWatchBooking(id);
  const [text, setText] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);

  const b = booking.data?.booking;
  const otherName = asStaff
    ? typeof b?.customer === 'object'
      ? b.customer.name
      : 'Customer'
    : b?.staff.map((s) => s.name.split(' ')[0]).join(', ') || 'Your captain';
  const open = !!b && ['confirmed', 'arriving', 'on_duty'].includes(b.status);

  const send = (body = text) => {
    const t = body.trim();
    if (!t || sendMsg.isPending) return;
    sendMsg.mutate(t, {
      onSuccess: () => {
        setText('');
        requestAnimationFrame(() => list.current?.scrollToEnd({ animated: true }));
      },
    });
  };

  const column = { width: '100%', maxWidth: tablet ? 720 : undefined, alignSelf: 'center' } as const;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Header title={otherName} />
      <Text variant="caption" tone="muted" style={styles.sub}>
        {b ? `Booking ${b.code}. ` : ''}Phone numbers stay private.
      </Text>
      {thread.isLoading ? <LoadingView /> : thread.error ? <ErrorView error={thread.error} onRetry={thread.refetch} /> : null}
      <FlatList
        ref={list}
        data={thread.data?.messages ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.list, column]}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          thread.data ? (
            <Text tone="muted" style={{ textAlign: 'center' }}>
              No messages yet. Say hello.
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => {
          const mine = item.from.id === myId;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              {!mine && asStaff === false && (b?.staff.length ?? 0) > 1 ? (
                <Text variant="caption" tone="muted">
                  {item.from.name}
                </Text>
              ) : null}
              <Text style={{ color: mine ? colors.onPrimary : colors.text }}>{item.text}</Text>
              <Text variant="caption" style={{ color: mine ? 'rgba(255,255,255,0.7)' : colors.textFaint, alignSelf: 'flex-end' }}>
                {time(item.createdAt)}
              </Text>
            </View>
          );
        }}
      />
      <KeyboardStickyView offset={{ opened: 0, closed: 0 }}>
        {!open ? (
          <Text variant="caption" tone="muted" style={[styles.sub, { padding: space.lg }]}>
            {b ? 'Chat is open while the booking is active.' : ''}
          </Text>
        ) : (
        <View style={column}>
          {sendMsg.error ? (
            <Text variant="caption" tone="danger" style={{ paddingHorizontal: space.lg }}>
              {(sendMsg.error as Error).message}
            </Text>
          ) : null}
          <View style={styles.quick}>
            {quickReplies[asStaff ? 'staff' : 'customer'].map((q) => (
              <Pressable key={q} onPress={() => send(q)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}>
                <Text variant="label">{q}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              accessibilityLabel="Message"
            />
            <Pressable
              onPress={() => send()}
              disabled={!text.trim() || sendMsg.isPending}
              accessibilityRole="button"
              accessibilityLabel="Send"
              style={[styles.send, !text.trim() && { opacity: 0.4 }]}>
              <SendHorizontal color={colors.onPrimary} size={iconSize.md} strokeWidth={iconStroke} />
            </Pressable>
          </View>
        </View>
        )}
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  sub: { textAlign: 'center', paddingBottom: space.sm },
  list: { padding: space.lg, gap: space.sm, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: space.sm, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.blue, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 6 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    outlineWidth: 0,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
