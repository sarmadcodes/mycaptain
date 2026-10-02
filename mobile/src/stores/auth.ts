import { create } from 'zustand';

import { secureStorage } from '@/lib/secure-storage';
import type { Role, User } from '@/types';

const TOKEN_KEY = 'mc.token';
const USER_KEY = 'mc.user';

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  // TODO(backend): validate stored token with GET /auth/me once the API exists.
  hydrate: async () => {
    try {
      const [token, rawUser] = await Promise.all([
        secureStorage.get(TOKEN_KEY),
        secureStorage.get(USER_KEY),
      ]);
      set({ token, user: token && rawUser ? (JSON.parse(rawUser) as User) : null });
    } finally {
      set({ hydrated: true });
    }
  },
  signIn: async (token, user) => {
    await Promise.all([
      secureStorage.set(TOKEN_KEY, token),
      secureStorage.set(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user });
  },
  signOut: async () => {
    await Promise.all([secureStorage.remove(TOKEN_KEY), secureStorage.remove(USER_KEY)]);
    set({ token: null, user: null });
  },
}));

export const isStaff = (role?: Role) => role === 'driver' || role === 'guard';
