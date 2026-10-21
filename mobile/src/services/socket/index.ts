import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';

import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';
import { addMessage } from '@/features/ops';
import type { ApiBooking, ChatMessage, StaffLocation } from '@/types/api';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const getSocket = () => socket;

function connect(token: string) {
  if (socket && currentToken === token) return;
  socket?.disconnect();
  currentToken = token;
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'], reconnectionDelayMax: 10_000 });

  // Keep cached screens fresh when the server reports a change.
  const onBooking = (b: ApiBooking) => {
    queryClient.setQueryData(['booking', b.id], (old: { booking: ApiBooking } | undefined) => (old ? { ...old, booking: b } : old));
    queryClient.invalidateQueries({ queryKey: ['booking', b.id] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };
  socket.on('booking:created', onBooking);
  socket.on('booking:updated', onBooking);
  socket.on('booking:removed', () => queryClient.invalidateQueries({ queryKey: ['bookings'] }));
  socket.on('company:new', () => queryClient.invalidateQueries({ queryKey: ['admin'] }));
  socket.on('company:updated', () => queryClient.invalidateQueries({ queryKey: ['admin'] }));
  socket.on('rates:updated', () => queryClient.invalidateQueries({ queryKey: ['rates'] }));
  socket.on('message:new', (m: ChatMessage) => addMessage(queryClient, m));
  socket.on('notification:new', () => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
  // Live staff position: patch the cached booking so maps move without refetching.
  socket.on('location', (l: StaffLocation & { booking: string }) => {
    queryClient.setQueryData(['booking', l.booking], (old: { booking: ApiBooking } | undefined) => {
      if (!old) return old;
      const others = (old.booking.locations ?? []).filter((x) => x.staff !== l.staff);
      return { ...old, booking: { ...old.booking, locations: [...others, l] } };
    });
  });
  socket.on('sos:new', () => queryClient.invalidateQueries({ queryKey: ['sos'] }));
  socket.on('sos:updated', () => queryClient.invalidateQueries({ queryKey: ['sos'] }));
  socket.on('case:new', () => queryClient.invalidateQueries({ queryKey: ['cases'] }));
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}

// Mounted once at the root: follows the signed-in session.
export function useLiveConnection() {
  const token = useAuth((s) => s.token);
  useEffect(() => {
    if (token) connect(token);
    else disconnectSocket();
  }, [token]);
}

// Follow one booking's room while a screen is open.
export function useWatchBooking(id?: string) {
  const token = useAuth((s) => s.token);
  useEffect(() => {
    if (!id || !socket) return;
    const s = socket;
    const watch = () => s.emit('booking:watch', id);
    watch();
    s.on('connect', watch); // rejoin after reconnects
    return () => {
      s.off('connect', watch);
      s.emit('booking:unwatch', id);
    };
  }, [id, token]);
}
