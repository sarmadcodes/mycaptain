import { useWindowDimensions } from 'react-native';

import { space } from '@/theme';

// Breakpoints (dp). Phones are < 768, tablets / foldables / web >= 768.
const TABLET = 768;
const DESKTOP = 1100;
const SMALL_PHONE = 360;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const compact = width < SMALL_PHONE;
  const tablet = width >= TABLET;
  const desktop = width >= DESKTOP;
  const landscape = width > height;

  const gutter = compact ? space.lg : tablet ? space.xxl : space.xl;
  const maxWidth = desktop ? 1080 : tablet ? 840 : width;
  const contentWidth = Math.min(width, maxWidth) - gutter * 2;

  // Pixel width of one column in a grid, accounting for the gaps between columns.
  const columnWidth = (cols: number, gap: number) => Math.floor((contentWidth - gap * (cols - 1)) / cols);

  // Use as ScrollView contentContainerStyle: centred, capped width, scaled padding.
  const content = {
    padding: gutter,
    width: '100%',
    maxWidth,
    alignSelf: 'center',
  } as const;

  return { width, height, compact, tablet, desktop, landscape, gutter, maxWidth, contentWidth, columnWidth, content };
}
