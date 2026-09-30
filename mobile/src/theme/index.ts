// My Captain design tokens. Brand colors come from the product spec;
// everything else is a quiet neutral scale so the brand blue carries the UI.

export const colors = {
  navy: '#101C30',
  blue: '#246BFD',
  paleBlue: '#EFF4FF',
  red: '#E45562',
  green: '#1F9D6B',
  amber: '#C98A1B',

  bg: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E6E8EC',
  text: '#101C30',
  textMuted: '#5B6475',
  textFaint: '#9AA1AE',
  onPrimary: '#FFFFFF',
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const iconSize = { sm: 16, md: 20, lg: 24 } as const;
// Icons: lucide-react-native only, strokeWidth 1.75, no emoji anywhere.
export const iconStroke = 1.75;
