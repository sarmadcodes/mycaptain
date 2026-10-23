import { router } from 'expo-router';
import { CreditCard, Lock, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Header, PhoneField, Screen, Segmented, Text, TextField } from '@/components/ui';
import { colors, space } from '@/theme';

const group = (s: string) =>
  s
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
const expiry = (s: string) => {
  const d = s.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// Demo: nothing is stored. With a real provider this becomes its hosted card fields.
export function AddPaymentMethod() {
  const [kind, setKind] = useState<'card' | 'wallet'>('card');
  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');
  const [name, setName] = useState('');
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState<string>();

  const save = async () => {
    if (kind === 'card' && (number.replace(/\s/g, '').length < 16 || exp.length < 5 || name.trim().length < 3)) {
      return setError('Check the card number, expiry and name.');
    }
    if (kind === 'wallet' && !/^3\d{9}$/.test(wallet)) return setError('Enter the wallet mobile number.');
    setError(undefined);
    router.back();
  };

  return (
    <Screen header={<Header title="Add payment method" />} footer={<Button label="Save" onPress={save} />}>
      <View style={styles.form}>
        <Segmented
          value={kind}
          onChange={(k) => (setKind(k), setError(undefined))}
          options={[
            { label: 'Card', value: 'card' },
            { label: 'JazzCash / Easypaisa', value: 'wallet' },
          ]}
        />
        {kind === 'card' ? (
          <>
            <TextField
              label="Card number"
              keyboardType="number-pad"
              placeholder="1234 5678 9012 3456"
              value={number}
              onChangeText={(t) => setNumber(group(t))}
              prefix={<CreditCard color={colors.textMuted} size={20} strokeWidth={1.75} />}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Expiry"
                  keyboardType="number-pad"
                  placeholder="MM/YY"
                  value={exp}
                  onChangeText={(t) => setExp(expiry(t))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="CVV" keyboardType="number-pad" placeholder="123" secureTextEntry maxLength={4} />
              </View>
            </View>
            <TextField label="Name on card" autoCapitalize="characters" value={name} onChangeText={setName} />
          </>
        ) : (
          <PhoneField
            label="Wallet mobile number"
            value={wallet}
            onChangeText={setWallet}
            hint="You approve each payment in the wallet app."
          />
        )}
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
        <View style={styles.secure}>
          {kind === 'card' ? (
            <Lock color={colors.textMuted} size={16} strokeWidth={1.75} />
          ) : (
            <Smartphone color={colors.textMuted} size={16} strokeWidth={1.75} />
          )}
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Demo mode: nothing is saved or charged. With real payments, details go straight to the payment provider and My Captain never stores your full card number.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  row: { flexDirection: 'row', gap: space.md },
  secure: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
