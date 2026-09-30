import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { Role, User } from '@/types';

const TOKEN_KEY = 'mc.token';

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
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ token, hydrated: true });
  },
  signIn: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));

export const isStaff = (role?: Role) => role === 'driver' || role === 'guard';
