import { Tabs } from 'expo-router';
import { CalendarDays, House, LifeBuoy, UserRound } from 'lucide-react-native';

import { tabBarOptions } from '@/components/tab-bar-options';
import { iconSize, iconStroke } from '@/theme';

export default function CustomerTabs() {
  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color }) => <LifeBuoy color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserRound color={color} size={iconSize.md} strokeWidth={iconStroke} />,
        }}
      />
    </Tabs>
  );
}
