import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { colors, fonts } from '@/theme';

export const tabBarOptions: ComponentProps<typeof Tabs>['screenOptions'] = {
  headerShown: false,
  tabBarActiveTintColor: colors.blue,
  tabBarInactiveTintColor: colors.textFaint,
  tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
  tabBarStyle: {
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    elevation: 0,
  },
};
