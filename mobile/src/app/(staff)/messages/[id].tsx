import { useLocalSearchParams } from 'expo-router';

import { driverAssignments, guardAssignments } from '@/lib/mock-data';
import { Chat } from '@/screens/shared/chat';

export default function StaffChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = [...driverAssignments, ...guardAssignments].find((x) => x.id === id);
  return <Chat asStaff otherName={a?.customer ?? 'Customer'} />;
}
