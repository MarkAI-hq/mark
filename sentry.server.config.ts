import * as Sentry from '@sentry/nextjs';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NODE_ENV,
    release:     process.env.NEXT_PUBLIC_APP_VERSION,

    tracesSampleRate: 0.1,

    enabled: true,
  });
}