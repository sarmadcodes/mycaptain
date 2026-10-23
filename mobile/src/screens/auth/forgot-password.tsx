import { router } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Header, OtpInput, PhoneField, Screen, Text, TextField } from '@/components/ui';
import { api, errorMessage } from '@/services/api/client';
import { colors, space } from '@/theme';

// Staff, partners and admins reset their password with a code sent to their phone.
export function ForgotPassword() {
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [hint, setHint] = useState<string>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(undefined);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      // Local checks throw plain errors; API failures get the server's message.
      setError(e instanceof Error && !('isAxiosError' in e) ? e.message : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const request = () =>
    run(async () => {
      if (!/^3\d{9}$/.test(phone)) throw new Error('Enter your registered mobile number.');
      const { data } = await api.post<{ phoneHint?: string }>('/auth/password/forgot', { identifier: phone });
      setHint(data.phoneHint);
      setStep('code');
    });

  const reset = () =>
    run(async () => {
      if (code.length !== 6) throw new Error('Enter the 6-digit code.');
      if (password.length < 8) throw new Error('Use at least 8 characters.');
      await api.post('/auth/password/reset', { identifier: phone, code, password });
      setStep('done');
    });

  if (step === 'done') {
    return (
      <Screen scroll={false} footer={<Button label="Sign in" onPress={() => router.replace('/staff-sign-in')} />}>
        <View style={styles.done}>
          <CheckCircle2 color={colors.green} size={56} strokeWidth={1.5} />
          <Text variant="title">Password changed</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            Sign in with your new password. Other devices have been signed out.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header />}
      footer={
        <Button label={step === 'phone' ? 'Send code' : 'Set new password'} loading={busy} onPress={step === 'phone' ? request : reset} />
      }>
      <View style={styles.intro}>
        <Text variant="title">Reset password</Text>
        <Text tone="muted">
          {step === 'phone'
            ? 'We will text a code to the mobile number on your account.'
            : `If an account uses this number, a code was sent${hint ? ` to ${hint}` : ''}. It expires in 5 minutes.`}
        </Text>
      </View>
      <View style={{ gap: space.xl }}>
        {step === 'phone' ? (
          <PhoneField label="Registered mobile number" autoFocus value={phone} onChangeText={setPhone} error={error} />
        ) : (
          <>
            <OtpInput value={code} onChange={setCode} />
            <TextField
              label="New password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              hint="At least 8 characters."
              error={error}
            />
            <Button label="Send a new code" variant="ghost" onPress={request} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
});
