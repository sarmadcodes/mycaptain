import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { CheckCircle2, ImagePlus, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, ChipGroup, Header, Screen, Section, Text, TextField } from '@/components/ui';
import { useBookings } from '@/features/api';
import { useOpenCase } from '@/features/ops';
import { currentPosition, describePosition, type Position } from '@/lib/location';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';
import type { CaseType } from '@/types/api';

type ReportFormProps = {
  type: CaseType;
  // Booking the report is about. Without one, recent bookings are offered.
  bookingId?: string;
  // Attach the reporter's location (accidents, incidents).
  withLocation?: boolean;
  title: string;
  intro: string;
  urgentNote?: string;
  reasonLabel: string;
  reasons: string[];
  extra?: { label: string; options: string[] };
  submitLabel: string;
};

// One form for accidents, complaints, replacements and staff incidents.
export function ReportForm({ type, bookingId, withLocation, title, intro, urgentNote, reasonLabel, reasons, extra, submitLabel }: ReportFormProps) {
  const open = useOpenCase();
  const recent = useBookings();
  const [picked, setPicked] = useState<string>();
  const booking = bookingId ?? picked;
  const [position, setPosition] = useState<Position | null | undefined>(withLocation ? undefined : null);
  const [result, setResult] = useState<{ ref: string; failed: number }>();
  useEffect(() => {
    if (withLocation) currentPosition().then(setPosition);
  }, [withLocation]);
  const [reason, setReason] = useState<string>();
  const [extraValue, setExtraValue] = useState<string | undefined>(extra?.options[0]);
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState<string>();

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets].slice(0, 6));
  };

  const submit = () => {
    if (!reason) return setError('Choose a reason.');
    setError(undefined);
    const lines = [
      `${reasonLabel}: ${reason}`,
      extra && extraValue ? `${extra.label}: ${extraValue}` : null,
      position ? `Location: ${describePosition(position)}` : null,
      details.trim() || null,
    ].filter(Boolean);
    open.mutate(
      {
        type,
        bookingId: booking,
        details: lines.join('\n'),
        urgent: extraValue === 'Urgent',
        files: photos.map((a, n) => ({
          uri: a.uri,
          name: a.fileName ?? `evidence-${n + 1}.${a.type === 'video' ? 'mp4' : 'jpg'}`,
          type: a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        })),
      },
      { onSuccess: (r) => setResult({ ref: r.case.ref, failed: r.failed }) },
    );
  };

  if (result) {
    return (
      <Screen scroll={false} footer={<Button label="Done" onPress={() => router.back()} />}>
        <View style={styles.done}>
          <CheckCircle2 color={colors.green} size={56} strokeWidth={1.5} />
          <Text variant="title">Sent to operations</Text>
          <Text tone="muted" style={{ textAlign: 'center' }}>
            Case {result.ref} is open. You will get updates in the app as the team responds.
            {result.failed ? ` ${result.failed} file(s) did not upload.` : ''}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title={title} />}
      footer={<Button label={submitLabel} loading={open.isPending} onPress={submit} />}>
      <View style={styles.form}>
        <Text tone="muted">{intro}</Text>
        {urgentNote ? (
          <Card style={styles.urgent}>
            <Text variant="label" style={{ color: colors.red }}>
              {urgentNote}
            </Text>
          </Card>
        ) : null}
        {withLocation ? (
          <View style={styles.auto}>
            <MapPin color={colors.blue} size={iconSize.sm} strokeWidth={iconStroke} />
            <Text variant="label" tone="muted" style={{ flex: 1 }}>
              {position === undefined
                ? 'Getting your location...'
                : position
                  ? `Location attached: ${describePosition(position)}`
                  : 'Location unavailable. Add the address in the details.'}
            </Text>
          </View>
        ) : null}
        {!bookingId && recent.data?.items.length ? (
          <Section title="Booking (optional)">
            <ChipGroup
              value={picked}
              onChange={(v) => setPicked(v === picked ? undefined : v)}
              options={recent.data.items.slice(0, 6).map((b) => ({ label: b.code, value: b.id }))}
            />
          </Section>
        ) : null}
        <Section title={reasonLabel}>
          <ChipGroup value={reason} onChange={setReason} options={reasons.map((r) => ({ label: r, value: r }))} />
          {error || open.error ? (
            <Text variant="caption" tone="danger">
              {error ?? (open.error as Error).message}
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
            {photos.map((a) => (
              <Pressable
                key={a.uri}
                onPress={() => setPhotos((p) => p.filter((x) => x.uri !== a.uri))}
                accessibilityLabel="Remove file"
                style={styles.thumb}>
                {a.type === 'video' ? (
                  <Text variant="caption" tone="muted">
                    Video
                  </Text>
                ) : (
                  <Image source={{ uri: a.uri }} style={styles.thumbImg} />
                )}
              </Pressable>
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
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
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
