import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Eye, EyeOff, Info } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Header, PhoneField, Screen, Text, TextField } from '@/components/ui';
import { AuthError, staffSignIn } from '@/features/auth/api';
import { staffSignInSchema, type StaffSignInForm } from '@/features/auth/schemas';
import { colors, iconSize, iconStroke, space } from '@/theme';

export function StaffSignIn() {
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState } = useForm<StaffSignInForm>({
    resolver: zodResolver(staffSignInSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(undefined);
    try {
      await staffSignIn(values);
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Try again.');
    }
  });

  const EyeIcon = showPassword ? EyeOff : Eye;

  return (
    <Screen header={<Header />} footer={<Button label="Sign in" loading={formState.isSubmitting} onPress={onSubmit} />}>
      <View style={styles.intro}>
        <Text variant="title">Staff sign in</Text>
        <Text tone="muted">For partner drivers and guards, and My Captain operations staff.</Text>
      </View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <PhoneField
              label="Registered mobile number"
              autoFocus
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
              error={fieldState.error?.message ?? error}
              suffix={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <EyeIcon color={colors.textMuted} size={iconSize.md} strokeWidth={iconStroke} />
                </Pressable>
              }
            />
          )}
        />
      </View>

      <Card tinted style={styles.note}>
        <Info color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
        <Text variant="label" tone="muted" style={styles.noteText}>
          Your company creates your account on the My Captain partner portal. Ask your company supervisor if you cannot sign in.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  fields: { gap: space.xl },
  note: { flexDirection: 'row', gap: space.md, marginTop: space.xxl },
  noteText: { flex: 1 },
});
