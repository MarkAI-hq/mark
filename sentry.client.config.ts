import * as Sentry from '@sentry/nextjs';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NODE_ENV,
    release:     process.env.NEXT_PUBLIC_APP_VERSION,

    tracesSampleRate: 0.1,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText:   true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    enabled: true,

    beforeSend(event) {
      if (event.exception?.values?.[0]?.value?.includes('401')) return null;
      if (event.exception?.values?.[0]?.value?.includes('403')) return null;
      return event;
    },
  });
}