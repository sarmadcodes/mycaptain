import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Text, TextField } from '@/components/ui';
import { useRate } from '@/features/ops';
import { colors, space } from '@/theme';
import type { ApiBooking } from '@/types/api';

// Star rating once a duty is finished. Shown read-only after it is sent.
export function RateBooking({ booking }: { booking: ApiBooking }) {
  const rate = useRate(booking.id);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const done = booking.rating;

  return (
    <Card style={{ gap: space.md }}>
      <Text variant="heading">{done ? 'Your rating' : 'How was the service?'}</Text>
      <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating ${done?.stars ?? stars} of 5`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= (done?.stars ?? stars);
          return (
            <Pressable key={n} disabled={!!done} onPress={() => setStars(n)} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} hitSlop={6}>
              <Star size={32} color={on ? '#F5A623' : colors.border} fill={on ? '#F5A623' : 'transparent'} strokeWidth={1.5} />
            </Pressable>
          );
        })}
      </View>
      {done ? (
        done.comment ? <Text tone="muted">{done.comment}</Text> : null
      ) : (
        <>
          <TextField label="Comment (optional)" value={comment} onChangeText={setComment} placeholder="What went well, or what could be better" multiline />
          {rate.error ? (
            <Text variant="caption" tone="danger">
              {(rate.error as Error).message}
            </Text>
          ) : null}
          <Button label="Send rating" disabled={!stars} loading={rate.isPending} onPress={() => rate.mutate({ stars, comment: comment.trim() || undefined })} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({ stars: { flexDirection: 'row', gap: space.sm } });
