import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Header, OtpInput, Screen, Text } from '@/components/ui';
import { AuthError, requestOtp, verifyOtp, type OtpPurpose } from '@/features/auth/api';
import { space } from '@/theme';
import { formatPkPhone } from '@/utils/phone';

const RESEND_SECONDS = 30;

export function Verify() {
  const params = useLocalSearchParams<{ phone: string; purpose: OtpPurpose; name?: string; email?: string; devCode?: string }>();
  const [devCode, setDevCode] = useState(params.devCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setError(undefined);
    setLoading(true);
    try {
      await verifyOtp({
        phone: params.phone,
        code: value,
        name: params.name,
        email: params.email || undefined,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const resend = async () => {
    setCode('');
    setError(undefined);
    setResendIn(RESEND_SECONDS);
    try {
      const r = await requestOtp(params.phone, params.purpose);
      setDevCode(r.devCode);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Could not send a new code.');
    }
  };

  return (
    <Screen
      header={<Header />}
      footer={<Button label="Verify" loading={loading} disabled={code.length !== 6} onPress={() => submit()} />}>
      <View style={styles.intro}>
        <Text variant="title">Enter the code</Text>
        <Text tone="muted">Sent by SMS to +92 {formatPkPhone(params.phone ?? '')}</Text>
        {devCode ? (
          <Text variant="label" tone="accent">
            Test build code: {devCode}
          </Text>
        ) : null}
      </View>

      <OtpInput
        value={code}
        error={!!error}
        onChange={(v) => {
          setCode(v);
          if (v.length === 6) submit(v);
        }}
      />

      <View style={styles.meta}>
        {error ? (
          <Text variant="label" tone="danger">
            {error}
          </Text>
        ) : null}
        {resendIn > 0 ? (
          <Text variant="label" tone="muted">
            Resend code in 0:{String(resendIn).padStart(2, '0')}
          </Text>
        ) : (
          <Pressable onPress={resend} hitSlop={8} accessibilityRole="button">
            <Text variant="label" tone="accent">
              Resend code
            </Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Text variant="label" tone="accent">
            Change number
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  meta: { marginTop: space.xl, gap: space.md },
});
