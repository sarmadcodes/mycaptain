import { Siren } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useSos } from '@/features/ops';
import { EMERGENCY } from '@/lib/config';
import { currentPosition } from '@/lib/location';
import { colors, iconStroke, radius, space } from '@/theme';

// Emergency alert to My Captain operations (and the partner company), with the sender's location.
// Asks for confirmation first, because a pocket press must not raise an alarm.
export function SosButton({ bookingId }: { bookingId?: string }) {
  const sos = useSos();
  const [sent, setSent] = useState(false);

  const raise = async () => {
    const position = await currentPosition(5000);
    sos.mutate(
      { bookingId, ...(position ? { lat: position.lat, lng: position.lng } : {}) },
      { onSuccess: () => setSent(true) },
    );
  };

  const confirm = () => {
    const title = 'Send emergency alert?';
    const body = 'Operations is alerted immediately with your location. If anyone is hurt or in danger, also call 1122 or 15.';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${title}\n\n${body}`)) raise();
      return;
    }
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send alert', style: 'destructive', onPress: raise },
    ]);
  };

  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        onPress={confirm}
        disabled={sos.isPending}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
        style={({ pressed }) => [styles.btn, (pressed || sos.isPending) && { opacity: 0.8 }]}>
        <Siren color="#fff" size={22} strokeWidth={iconStroke} />
        <Text variant="heading" style={{ color: '#fff' }}>
          {sos.isPending ? 'Sending alert...' : sent ? 'Alert sent. Send again' : 'Emergency SOS'}
        </Text>
      </Pressable>
      {sent ? (
        <Text variant="caption" tone="muted">
          Operations has your alert and location. Keep your phone with you; they will call or message you here.
        </Text>
      ) : null}
      {sos.error ? (
        <Text variant="caption" tone="danger">
          {(sos.error as Error).message} Call {EMERGENCY.police} or {EMERGENCY.rescue} directly.
        </Text>
      ) : null}
      <View style={styles.row}>
        <Pressable onPress={() => Linking.openURL(`tel:${EMERGENCY.police}`)} style={styles.call} accessibilityRole="button">
          <Text variant="label">Police {EMERGENCY.police}</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(`tel:${EMERGENCY.rescue}`)} style={styles.call} accessibilityRole="button">
          <Text variant="label">Rescue {EMERGENCY.rescue}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  row: { flexDirection: 'row', gap: space.sm },
  call: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
