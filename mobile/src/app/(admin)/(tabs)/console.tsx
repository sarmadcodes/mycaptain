import { router } from 'expo-router';
import { Banknote, Globe, MapPinned, Tags } from 'lucide-react-native';
import { Linking } from 'react-native';

import { PARTNER_PORTAL_URL } from '@/lib/mock-data';
import { Profile } from '@/screens/shared/profile';

const items = [
  { icon: Tags, title: 'Rate cards', subtitle: 'Prices by service and vehicle', onPress: () => router.push('/rates') },
  { icon: Banknote, title: 'Payouts', subtitle: 'Weekly partner transfers', onPress: () => router.push('/payouts') },
  { icon: MapPinned, title: 'Service cities', subtitle: 'Where customers can book', onPress: () => router.push('/cities') },
  {
    icon: Globe,
    title: 'Partner website',
    subtitle: 'partners.mycaptain.pk',
    onPress: () => Linking.openURL(PARTNER_PORTAL_URL),
  },
];

export default function AdminConsoleRoute() {
  return <Profile items={items} />;
}
