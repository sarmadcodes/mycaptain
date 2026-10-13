import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, Header, PhoneField, Screen, Text, TextField } from '@/components/ui';
import { AuthError, requestOtp } from '@/features/auth/api';
import { signUpSchema, type SignUpForm } from '@/features/auth/schemas';
import { space } from '@/theme';

export function SignUp() {
  const [error, setError] = useState<string>();
  const { control, handleSubmit, formState } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', phone: '', email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(undefined);
    try {
      const r = await requestOtp(values.phone, 'sign-up');
      router.push({ pathname: '/verify', params: { ...values, purpose: 'sign-up', devCode: r.devCode } });
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'We could not send the code. Try again.');
    }
  });

  return (
    <Screen
      header={<Header />}
      footer={
        <>
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          <Button label="Continue" loading={formState.isSubmitting} onPress={onSubmit} />
        </>
      }>
      <View style={styles.intro}>
        <Text variant="title">Create your account</Text>
        <Text tone="muted">Book drivers and security in a few taps.</Text>
      </View>
      <View style={styles.fields}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label="Full name"
              autoFocus
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <PhoneField
              label="Mobile number"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              hint="Receipts and invoices are sent here."
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  fields: { gap: space.xl },
});
