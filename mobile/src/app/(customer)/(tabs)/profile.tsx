import { router } from 'expo-router';
import { Bell, CreditCard, FileText, Receipt, UserRound } from 'lucide-react-native';

import { Profile } from '@/screens/shared/profile';

const items = [
  { icon: UserRound, title: 'Personal details', onPress: () => router.push('/settings/details') },
  { icon: CreditCard, title: 'Payment methods', onPress: () => router.push('/settings/payments') },
  { icon: Receipt, title: 'Invoices and receipts', onPress: () => router.push('/settings/invoices') },
  { icon: FileText, title: 'Contracts', subtitle: '6-month driver plan', onPress: () => router.push('/settings/contracts') },
  { icon: Bell, title: 'Notifications', onPress: () => router.push('/settings/notifications') },
];

export default function CustomerProfileRoute() {
  return <Profile items={items} />;
}
