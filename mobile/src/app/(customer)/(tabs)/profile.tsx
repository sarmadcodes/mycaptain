import { Bell, CreditCard, FileText, Receipt, UserRound } from 'lucide-react-native';

import { Profile } from '@/screens/shared/profile';

const items = [
  { icon: UserRound, title: 'Personal details' },
  { icon: CreditCard, title: 'Payment methods' },
  { icon: Receipt, title: 'Invoices and receipts' },
  { icon: FileText, title: 'Contracts', subtitle: '6-month driver plan, renews 1 Oct' },
  { icon: Bell, title: 'Notifications' },
];

export default function CustomerProfileRoute() {
  return <Profile items={items} />;
}
