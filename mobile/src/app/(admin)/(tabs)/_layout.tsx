import { Tabs } from 'expo-router';
import { Building2, ClipboardList, LayoutDashboard, LifeBuoy, Settings } from 'lucide-react-native';

import { tabBarOptions } from '@/components/tab-bar-options';
import { iconSize, iconStroke } from '@/theme';

export default function AdminTabs() {
  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="dispatch"
        options={{
          title: 'Dispatch',
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color }) => <LifeBuoy color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: 'Partners',
          tabBarIcon: ({ color }) => <Building2 color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="console"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
    </Tabs>
  );
}
