import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Connected after sign-in; used for live location, duty status and alerts.
export function connectSocket(token: string) {
  socket?.disconnect();
  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
