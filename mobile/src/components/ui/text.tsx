import { Text as RNText, type TextProps } from 'react-native';

import { colors, type } from '@/theme';

type Variant = keyof typeof type;
type Tone = 'default' | 'muted' | 'faint' | 'inverse' | 'accent' | 'danger';

const toneColor: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  inverse: colors.onPrimary,
  accent: colors.blue,
  danger: colors.red,
};

export type AppTextProps = TextProps & { variant?: Variant; tone?: Tone };

export function Text({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[type[variant], { color: toneColor[tone] }, style]} />;
}
