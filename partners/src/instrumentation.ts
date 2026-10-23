import * as Sentry from '@sentry/nextjs';

// Server-side error monitoring. Off unless SENTRY_DSN is set.
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    // Never send request bodies or cookies: they carry passwords and session tokens.
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) delete event.request.headers.cookie;
      }
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
