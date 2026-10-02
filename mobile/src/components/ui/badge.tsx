import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme';

import { Text } from './text';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';

const tones: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: colors.paleBlue, fg: colors.blue },
  green: { bg: '#E6F5EE', fg: colors.green },
  amber: { bg: '#FBF1DE', fg: colors.amber },
  red: { bg: '#FCEBEC', fg: colors.red },
  neutral: { bg: colors.surface, fg: colors.textMuted },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text variant="caption" style={{ color: t.fg, fontFamily: 'Manrope_600SemiBold' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.sm },
});
