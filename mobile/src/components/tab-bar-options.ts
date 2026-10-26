import type { Tabs } from 'expo-router';
import { useMemo, type ComponentProps } from 'react';

import { useResponsive } from '@/lib/use-responsive';
import { colors, fonts } from '@/theme';

type ScreenOptions = ComponentProps<typeof Tabs>['screenOptions'];

function build(compact: boolean, tablet: boolean): ScreenOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.blue,
    tabBarInactiveTintColor: colors.textFaint,
    tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: compact ? 10 : tablet ? 13 : 11 },
    tabBarStyle: {
      backgroundColor: colors.bg,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      elevation: 0,
      ...(tablet ? { paddingTop: 6 } : null),
    },
  };
}

// Static version, unchanged behaviour. Other layouts (e.g. staff) can keep using it.
export const tabBarOptions = build(false, false);

// Responsive version: scales label size on small phones and tablets.
export function useTabBarOptions() {
  const { compact, tablet } = useResponsive();
  return useMemo(() => build(compact, tablet), [compact, tablet]);
}
