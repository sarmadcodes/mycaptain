import { Tabs } from 'expo-router';
import { Bell, Briefcase, Radio, UserRound, Wallet } from 'lucide-react-native';

import { tabBarOptions } from '@/components/tab-bar-options';
import { useAuth } from '@/stores/auth';
import { iconSize, iconStroke } from '@/theme';

// One staff area for drivers and guards; the third tab differs by role.
export default function StaffTabs() {
  const isGuard = useAuth((s) => s.user?.role === 'guard');

  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="jobs"
        options={{
          title: isGuard ? 'Shifts' : 'Jobs',
          tabBarIcon: ({ color }) => <Briefcase color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="duty"
        options={{
          title: 'Duty',
          tabBarIcon: ({ color }) => <Radio color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          href: isGuard ? null : undefined,
          title: 'Earnings',
          tabBarIcon: ({ color }) => <Wallet color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          href: isGuard ? undefined : null,
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserRound color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
    </Tabs>
  );
}
