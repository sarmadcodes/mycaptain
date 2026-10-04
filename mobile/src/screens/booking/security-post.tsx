import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LiveMap } from '@/components/map/live-map';
import { Button, Header, Screen, Section, Stepper, Text, TextField } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { space } from '@/theme';

export function SecurityPostStep() {
  const post = useBookingDraft((s) => s.post);
  const service = useBookingDraft((s) => s.service);
  const personnel = useBookingDraft((s) => s.personnel);
  const set = useBookingDraft((s) => s.set);
  const [error, setError] = useState<string>();
  const patch = (p: Partial<typeof post>) => set({ post: { ...post, ...p } });

  const next = () => {
    if (post.address.trim().length < 4) return setError('Enter the duty address.');
    setError(undefined);
    router.push('/book/security/guards');
  };

  return (
    <Screen header={<Header title="Duty post" />} footer={<Button label="See personnel" onPress={next} />}>
      <View style={styles.intro}>
        <Text variant="title">Where is the post?</Text>
        <Text tone="muted">Pin the exact gate, floor or checkpoint.</Text>
      </View>
      <View style={styles.form}>
        <LiveMap height={160} />
        <TextField
          label="Address"
          placeholder="House 12, Street 4, Clifton Block 5"
          value={post.address}
          onChangeText={(t) => patch({ address: t })}
          error={error}
        />
        <TextField
          label="Assigned point"
          placeholder="Main gate, reception, parking"
          value={post.point}
          onChangeText={(t) => patch({ point: t })}
        />
        {service === 'guard' ? (
          <Section title="Guards needed">
            <Stepper value={personnel} min={1} max={20} onChange={(v) => set({ personnel: v })} />
          </Section>
        ) : null}
        <TextField
          label="Instructions (optional)"
          placeholder="Uniform, shift handover, site contact"
          value={post.instructions}
          onChangeText={(t) => patch({ instructions: t })}
          multiline
          style={{ minHeight: 80, paddingTop: 14, textAlignVertical: 'top' }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  form: { gap: space.xl },
});
