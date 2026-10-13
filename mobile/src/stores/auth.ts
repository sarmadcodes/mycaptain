import { create } from 'zustand';

import { secureStorage } from '@/lib/secure-storage';
import type { ApiUser, Role, Session } from '@/types/api';

const ACCESS_KEY = 'mc.access';
const REFRESH_KEY = 'mc.refresh';
const USER_KEY = 'mc.user';

type AuthState = {
  user: ApiUser | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (s: Session) => Promise<void>;
  setUser: (u: ApiUser) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const [token, refreshToken, rawUser] = await Promise.all([
        secureStorage.get(ACCESS_KEY),
        secureStorage.get(REFRESH_KEY),
        secureStorage.get(USER_KEY),
      ]);
      const user = refreshToken && rawUser ? (JSON.parse(rawUser) as ApiUser) : null;
      set({ token: user ? token : null, refreshToken: user ? refreshToken : null, user });
    } catch {
      set({ token: null, refreshToken: null, user: null });
    } finally {
      set({ hydrated: true });
    }
  },
  setSession: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      secureStorage.set(ACCESS_KEY, accessToken),
      secureStorage.set(REFRESH_KEY, refreshToken),
      secureStorage.set(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token: accessToken, refreshToken, user });
  },
  setUser: async (user) => {
    await secureStorage.set(USER_KEY, JSON.stringify(user));
    set({ user });
  },
  clear: async () => {
    await Promise.all([secureStorage.remove(ACCESS_KEY), secureStorage.remove(REFRESH_KEY), secureStorage.remove(USER_KEY)]);
    set({ token: null, refreshToken: null, user: null });
  },
}));

export const isStaff = (role?: Role) => role === 'driver' || role === 'guard';

// Landing screen for each role's area of the app.
export const homeFor = (role: Role) =>
  (role === 'admin' ? '/overview' : isStaff(role) ? '/jobs' : '/home') as '/overview' | '/jobs' | '/home';
