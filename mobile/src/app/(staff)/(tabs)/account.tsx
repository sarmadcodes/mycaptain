import { router } from 'expo-router';
import { Building2, CalendarCheck, FileText, History, LifeBuoy } from 'lucide-react-native';
import { Linking } from 'react-native';

import { SUPPORT_PHONE } from '@/lib/config';
import { Profile } from '@/screens/shared/profile';

const items = [
  {
    icon: CalendarCheck,
    title: 'Availability',
    subtitle: 'Working days and shifts',
    onPress: () => router.push('/me/availability'),
  },
  { icon: History, title: 'Duty history', subtitle: 'Check-ins, reports and hours', onPress: () => router.push('/me/history') },
  { icon: FileText, title: 'Documents', subtitle: 'CNIC, licence, training', onPress: () => router.push('/me/documents') },
  { icon: Building2, title: 'Your company', onPress: () => router.push('/me/company') },
  {
    icon: LifeBuoy,
    title: 'Contact operations',
    subtitle: 'Available 24 hours',
    onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`),
  },
];

export default function StaffAccountRoute() {
  return <Profile items={items} />;
}
