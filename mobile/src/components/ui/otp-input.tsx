import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  error?: boolean;
};

// One hidden input drives the boxes, so paste and SMS autofill both work.
export function OtpInput({ value, onChange, length = 6, error }: OtpInputProps) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(true);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code">
      <View style={styles.row}>
        {Array.from({ length }, (_, i) => {
          const active = focused && i === Math.min(value.length, length - 1);
          const borderColor = error ? colors.red : active ? colors.blue : value[i] ? colors.navy : colors.border;
          return (
            <View key={i} style={[styles.cell, { borderColor }]}>
              <TextInput editable={false} pointerEvents="none" value={value[i] ?? ''} style={styles.digit} />
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        autoFocus
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  cell: {
    flex: 1,
    height: 58,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontFamily: fonts.semibold, fontSize: 22, color: colors.text, textAlign: 'center', padding: 0 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
