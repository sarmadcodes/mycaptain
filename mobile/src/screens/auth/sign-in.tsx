import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, Header, Screen, Text, TextField } from '@/components/ui';
import { AuthError, requestOtp } from '@/features/auth/api';
import { signInSchema, type SignInForm } from '@/features/auth/schemas';
import { parseIdentifier } from '@/utils/phone';
import { space } from '@/theme';

export function SignIn() {
  const [error, setError] = useState<string>();
  const { control, handleSubmit, formState } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = handleSubmit(async ({ identifier }) => {
    setError(undefined);
    const id = parseIdentifier(identifier)!;
    const phone = 'phone' in id ? id.phone : undefined;
    const loginEmail = 'email' in id ? id.email : undefined;
    try {
      const r = await requestOtp(phone, 'sign-in', loginEmail);
      router.push({
        pathname: '/verify',
        params: { phone: phone ?? '', loginEmail: loginEmail ?? '', purpose: 'sign-in', devCode: r.devCode, sentTo: r.sentTo, demo: r.demo ? '1' : '' },
      });
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'We could not send the code. Try again.');
    }
  });

  return (
    <Screen
      header={<Header />}
      footer={
        <>
          <Button label="Send code" loading={formState.isSubmitting} onPress={onSubmit} />
          <Button label="Create an account" variant="ghost" onPress={() => router.push('/sign-up')} />
        </>
      }>
      <View style={styles.intro}>
        <Text variant="title">Welcome back</Text>
        <Text tone="muted">Enter your mobile number or email. We send a 6-digit code to the email on your account.</Text>
      </View>
      <Controller
        control={control}
        name="identifier"
        render={({ field, fieldState }) => (
          <TextField
            label="Mobile number or email"
            placeholder="300 123 4567 or you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="username"
            autoFocus
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => onSubmit()}
            error={fieldState.error?.message ?? error}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
});
