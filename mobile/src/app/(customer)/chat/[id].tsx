import { useLocalSearchParams } from 'expo-router';

import { findBooking, findStaff } from '@/lib/mock-data';
import { Chat } from '@/screens/shared/chat';

export default function CustomerChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const staff = findStaff(findBooking(id)?.staffId);
  return <Chat otherName={staff?.name ?? 'Your captain'} />;
}
