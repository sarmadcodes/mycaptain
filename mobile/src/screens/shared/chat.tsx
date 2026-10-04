import { useLocalSearchParams } from 'expo-router';
import { SendHorizontal } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, Text } from '@/components/ui';
import { useResponsive } from '@/lib/use-responsive';
import { colors, fonts, iconSize, iconStroke, radius, space } from '@/theme';

type Msg = { id: string; mine: boolean; text: string; time: string };

const quickReplies = ['I am at the gate', 'Please wait 5 minutes', 'Where should you park?', 'Thank you'];

// Booking chat between customer and assigned staff. Numbers stay private.
// TODO(backend): messages over the socket, stored per booking.
export function Chat({ otherName, asStaff = false }: { otherName: string; asStaff?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tablet } = useResponsive();
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>(() =>
    [
      { id: '1', mine: false, text: 'Assalam o alaikum, I am on my way. ETA 18 minutes.', time: '4:42 PM' },
      { id: '2', mine: true, text: 'Walaikum assalam, please come to the main entrance.', time: '4:43 PM' },
      { id: '3', mine: false, text: 'Noted, see you there.', time: '4:43 PM' },
    ].map((m) => (asStaff ? { ...m, mine: !m.mine } : m)),
  );
  const list = useRef<FlatList<Msg>>(null);

  const send = (body = text) => {
    const t = body.trim();
    if (!t) return;
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMsgs((m) => [...m, { id: String(Date.now()), mine: true, text: t, time }]);
    setText('');
    requestAnimationFrame(() => list.current?.scrollToEnd({ animated: true }));
  };

  const column = { width: '100%', maxWidth: tablet ? 720 : undefined, alignSelf: 'center' } as const;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Header title={otherName} />
      <Text variant="caption" tone="muted" style={styles.sub}>
        Booking {id}. Phone numbers stay private.
      </Text>
      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.list, column]}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
            <Text style={{ color: item.mine ? colors.onPrimary : colors.text }}>{item.text}</Text>
            <Text
              variant="caption"
              style={{ color: item.mine ? 'rgba(255,255,255,0.7)' : colors.textFaint, alignSelf: 'flex-end' }}>
              {item.time}
            </Text>
          </View>
        )}
      />
      <KeyboardStickyView offset={{ opened: 0, closed: 0 }}>
        <View style={column}>
          <View style={styles.quick}>
            {quickReplies.map((q) => (
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
              disabled={!text.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send"
              style={[styles.send, !text.trim() && { opacity: 0.4 }]}>
              <SendHorizontal color={colors.onPrimary} size={iconSize.md} strokeWidth={iconStroke} />
            </Pressable>
          </View>
        </View>
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
