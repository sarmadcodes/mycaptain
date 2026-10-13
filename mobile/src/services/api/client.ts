import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuth } from '@/stores/auth';
import type { Session } from '@/types/api';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({ baseURL: API_URL, timeout: 20_000 });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One refresh at a time; concurrent 401s wait for the same promise.
let refreshing: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  const { refreshToken, setSession, clear } = useAuth.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<Session>(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 15_000 });
    await setSession(data);
    return data.accessToken;
  } catch (e) {
    // Only a real rejection ends the session; network errors keep it for a retry.
    if ((e as AxiosError).response?.status === 401) await clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/') && !original.url.startsWith('/auth/me');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= refreshSession().finally(() => (refreshing = null));
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public fields?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

// Turns any request failure into a message a person can act on.
export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  const ax = e as AxiosError<{ error?: { code: string; message: string; details?: { fields?: { path: string; message: string }[] } } }>;
  if (ax?.isAxiosError) {
    const body = ax.response?.data?.error;
    if (body) return new ApiError(body.message, body.code, ax.response?.status, body.details?.fields);
    if (ax.code === 'ECONNABORTED') return new ApiError('The server took too long to answer. Try again.', 'timeout');
    if (!ax.response) return new ApiError('No connection. Check your internet and try again.', 'network');
    return new ApiError('Something went wrong. Please try again.', 'unknown', ax.response.status);
  }
  return new ApiError('Something went wrong. Please try again.', 'unknown');
}

export const errorMessage = (e: unknown) => toApiError(e).message;
