import { StyleSheet, View } from 'react-native';

import { colors, space } from '@/theme';
import { formatPkPhone } from '@/utils/phone';

import { Text } from './text';
import { TextField, type TextFieldProps } from './text-field';

type PhoneFieldProps = Omit<TextFieldProps, 'onChangeText' | 'value' | 'prefix'> & {
  value: string;
  onChangeText: (digits: string) => void;
};

// Pakistani mobile number. Stores the 10 local digits (3XX XXXXXXX), shows them grouped.
export function PhoneField({ value, onChangeText, ...rest }: PhoneFieldProps) {
  return (
    <TextField
      keyboardType="number-pad"
      textContentType="telephoneNumber"
      autoComplete="tel"
      placeholder="3XX XXX XXXX"
      maxLength={12}
      value={formatPkPhone(value)}
      onChangeText={(t) => onChangeText(t.replace(/\D/g, '').replace(/^0/, '').slice(0, 10))}
      prefix={
        <View style={styles.prefix}>
          <Text variant="heading">+92</Text>
          <View style={styles.divider} />
        </View>
      }
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  prefix: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  divider: { width: 1, height: 22, backgroundColor: colors.border },
});
