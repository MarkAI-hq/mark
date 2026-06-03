// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { CookiesProvider } from 'next-client-cookies/server';

import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { cn } from '@/lib/utils';

import { getSession } from '@/lib/session';
import { AuthInitializer } from '@/components/auth/auth-initializer';
import { PostHogProvider, PostHogPageview } from '@/components/providers/posthog-provider';
import { CookieBanner } from '@/components/consent/cookie-banner';

export const viewport: Viewport = {
  themeColor: '#c9a84c',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Mirror Intelligence',
  description: 'Teaching Intelligence, Learning Intelligence, and School Insights — in one closed-loop platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mirror Intelligence',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon32.png',      sizes: '32x32', type: 'image/png' },
      { url: '/icons/mirror-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/mirror-192x192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/icons/mirror-192x192.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <AuthInitializer user={user} />

        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CookiesProvider>
              <Suspense fallback={null}>
                <PostHogPageview />
              </Suspense>
              {children}
            </CookiesProvider>
            <Toaster position="bottom-right" richColors />
            <CookieBanner />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}