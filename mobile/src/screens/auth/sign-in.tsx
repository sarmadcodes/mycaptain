import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, Header, PhoneField, Screen, Text } from '@/components/ui';
import { AuthError, requestOtp } from '@/features/auth/api';
import { phoneSchema, type PhoneForm } from '@/features/auth/schemas';
import { space } from '@/theme';

export function SignIn() {
  const [error, setError] = useState<string>();
  const { control, handleSubmit, formState } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    setError(undefined);
    try {
      const r = await requestOtp(phone, 'sign-in');
      router.push({ pathname: '/verify', params: { phone, purpose: 'sign-in', devCode: r.devCode } });
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
        <Text tone="muted">Enter your mobile number. We will text you a 6-digit code.</Text>
      </View>
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <PhoneField
            label="Mobile number"
            autoFocus
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={onSubmit}
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
