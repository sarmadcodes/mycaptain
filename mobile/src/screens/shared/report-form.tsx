import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { CheckCircle2, ImagePlus, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, ChipGroup, Header, Screen, Section, Text, TextField } from '@/components/ui';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

type ReportFormProps = {
  title: string;
  intro: string;
  urgentNote?: string;
  reasonLabel: string;
  reasons: string[];
  extra?: { label: string; options: string[] };
  submitLabel: string;
  autoContext?: string;
};

// One form for accidents, complaints, replacements and staff incidents.
export function ReportForm({ title, intro, urgentNote, reasonLabel, reasons, extra, submitLabel, autoContext }: ReportFormProps) {
  const [reason, setReason] = useState<string>();
  const [extraValue, setExtraValue] = useState<string | undefined>(extra?.options[0]);
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 6));
  };

  // TODO(backend): POST /cases with booking, reason, details and uploaded evidence.
  const submit = async () => {
    if (!reason) return setError('Choose a reason.');
    setError(undefined);
    setState('sending');
    await new Promise((r) => setTimeout(r, 1000));
    setState('sent');
  };

  if (state === 'sent') {
    return (
      <Screen scroll={false} footer={<Button label="Done" onPress={() => router.back()} />}>
        <View style={styles.done}>
          <CheckCircle2 color={colors.green} size={56} strokeWidth={1.5} />
          <Text variant="title">Sent to operations</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            Case MC-C09 is open. You will get updates in the app as the team responds.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title={title} />}
      footer={<Button label={submitLabel} loading={state === 'sending'} onPress={submit} />}>
      <View style={styles.form}>
        <Text tone="muted">{intro}</Text>
        {urgentNote ? (
          <Card style={styles.urgent}>
            <Text variant="label" style={{ color: colors.red }}>
              {urgentNote}
            </Text>
          </Card>
        ) : null}
        {autoContext ? (
          <View style={styles.auto}>
            <MapPin color={colors.blue} size={iconSize.sm} strokeWidth={iconStroke} />
            <Text variant="label" tone="muted">
              {autoContext}
            </Text>
          </View>
        ) : null}
        <Section title={reasonLabel}>
          <ChipGroup value={reason} onChange={setReason} options={reasons.map((r) => ({ label: r, value: r }))} />
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
        </Section>
        {extra ? (
          <Section title={extra.label}>
            <ChipGroup value={extraValue} onChange={setExtraValue} options={extra.options.map((o) => ({ label: o, value: o }))} />
          </Section>
        ) : null}
        <TextField
          label="Details"
          placeholder="What happened, and anything we should know"
          value={details}
          onChangeText={setDetails}
          multiline
          style={{ minHeight: 110, paddingTop: 14, textAlignVertical: 'top' }}
        />
        <Section title="Photos or video (optional)">
          <View style={styles.photos}>
            {photos.map((uri) => (
              <View key={uri} style={styles.thumb}>
                <Text variant="caption" tone="muted">
                  Added
                </Text>
              </View>
            ))}
            <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel="Add evidence" style={styles.add}>
              <ImagePlus color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} />
            </Pressable>
          </View>
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  urgent: { backgroundColor: '#FCEBEC', borderColor: '#FCEBEC' },
  auto: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
});
