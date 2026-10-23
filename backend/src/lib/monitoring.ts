import * as Sentry from '@sentry/node';

import { env, isTest } from '@/config/env';

// Error monitoring with Sentry. Off unless SENTRY_DSN is set. Request bodies, cookies and
// auth headers are stripped so passwords, codes and tokens never leave the server.
export const monitoring = !!env.SENTRY_DSN && !isTest;

if (monitoring) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        const h = event.request.headers ?? {};
        delete h.authorization;
        delete h.cookie;
      }
      return event;
    },
  });
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (monitoring) Sentry.captureException(err, context ? { extra: context } : undefined);
}

export const flushMonitoring = () => (monitoring ? Sentry.flush(2000) : Promise.resolve(true));
