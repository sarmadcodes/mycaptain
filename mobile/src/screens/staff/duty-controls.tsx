import { useState } from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTransition } from '@/features/api';
import { errorMessage } from '@/services/api/client';
import { space } from '@/theme';
import type { ApiBooking, BookingStatus } from '@/types/api';

const label: Partial<Record<BookingStatus, (guard: boolean) => string>> = {
  arriving: () => 'I am on my way',
  on_duty: (g) => (g ? 'Check in at post and start' : 'Arrived, start duty'),
  completed: () => 'Finish duty',
};

// The next step a driver or guard can take on a booking, as one primary button.
export function DutyControls({ booking, next, guard }: { booking: ApiBooking; next: BookingStatus[]; guard: boolean }) {
  const t = useTransition(booking.id);
  const [error, setError] = useState<string>();
  const step = (['arriving', 'on_duty', 'completed'] as const).find((s) => next.includes(s));
  if (!step) return null;

  return (
    <View style={{ gap: space.sm }}>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={label[step]!(guard)}
        loading={t.isPending}
        onPress={async () => {
          setError(undefined);
          try {
            await t.mutateAsync({ to: step });
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      />
    </View>
  );
}
