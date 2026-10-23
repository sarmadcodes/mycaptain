import { env, isTest } from '@/config/env';

import { logger } from './logger';

// Error monitoring with Sentry. Off unless SENTRY_DSN is set; the SDK is only loaded then, so a
// problem in the Sentry package can never stop the API from starting. Request bodies, cookies
// and auth headers are stripped so passwords, codes and tokens never leave the server.
export const monitoring = !!env.SENTRY_DSN && !isTest;

type SentryModule = typeof import('@sentry/node');
let sentry: SentryModule | undefined;

if (monitoring) {
  import('@sentry/node')
    .then((Sentry) => {
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
      sentry = Sentry;
    })
    .catch((err) => logger.error({ err }, 'error monitoring could not start'));
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  sentry?.captureException(err, context ? { extra: context } : undefined);
}

export const flushMonitoring = () => (sentry ? sentry.flush(2000) : Promise.resolve(true));
