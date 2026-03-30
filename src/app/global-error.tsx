// src/app/global-error.tsx
// Next.js requires this file at the app root to catch render errors.
// It wraps the error in Sentry before showing a fallback UI.
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error:  Error & { digest?: string };
  reset:  () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, background: '#f4f4f5' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 48, margin: '0 0 16px' }}>⚠️</p>
          <h2 style={{ margin: '0 0 8px', color: '#18181b' }}>Something went wrong</h2>
          <p style={{ color: '#71717a', marginBottom: 24 }}>
            This error has been reported. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ background: '#18181b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}