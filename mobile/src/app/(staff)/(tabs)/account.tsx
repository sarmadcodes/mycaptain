import { CalendarCheck, FileText, History, LifeBuoy, ShieldCheck } from 'lucide-react-native';

import { Profile } from '@/screens/shared/profile';

const items = [
  { icon: CalendarCheck, title: 'Availability', subtitle: 'Set your working days' },
  { icon: History, title: 'Duty history', subtitle: 'Check-ins, reports and hours' },
  { icon: FileText, title: 'Documents', subtitle: 'CNIC, licence, training' },
  { icon: ShieldCheck, title: 'Company verification' },
  { icon: LifeBuoy, title: 'Contact operations' },
];

export default function StaffProfileRoute() {
  return <Profile items={items} />;
}
