import * as Sentry from '@sentry/nextjs';

// Browser error monitoring. Off unless NEXT_PUBLIC_SENTRY_DSN is set at build time.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: process.env.NODE_ENV, tracesSampleRate: 0 });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
