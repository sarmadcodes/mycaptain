'use client';

import type { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

async function token(fresh = false) {
  const res = await fetch(`/api/auth/token${fresh ? '?fresh=1' : ''}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return ((await res.json()) as { token: string }).token;
}

// Opens the live-updates socket for the signed-in partner and refreshes cached data on events.
export async function connectLive(qc: QueryClient): Promise<Socket | null> {
  const t = await token();
  if (!t) return null;
  const socket = io(SOCKET_URL, { auth: { token: t }, transports: ['websocket'], reconnectionDelayMax: 10_000 });

  // Access tokens are short-lived: fetch a fresh one before reconnecting.
  socket.on('connect_error', async (err) => {
    if (err.message === 'unauthorized') {
      const next = await token(true);
      if (next) {
        socket.auth = { token: next };
        socket.connect();
      }
    }
  });

  const bookings = () => qc.invalidateQueries({ queryKey: ['bookings'] });
  socket.on('booking:created', bookings);
  socket.on('booking:updated', bookings);
  socket.on('booking:removed', bookings);
  socket.on('company:updated', () => qc.invalidateQueries({ queryKey: ['company'] }));
  return socket;
}
