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
import { InstallPrompt, type InstallAudience } from '@/components/pwa/install-prompt';
import { SessionCacheGuard } from '@/components/pwa/session-cache-guard';
import { PWA_EARLY_CAPTURE_SCRIPT } from '@/lib/pwa';

// Same priority order as src/middleware.ts getUser().
function installAudience(user: Awaited<ReturnType<typeof getSession>>): InstallAudience {
  if (!user) return 'guest';
  const roles: string[] = (user as { roles?: string[] }).roles ?? [user.role].filter(Boolean);
  for (const r of ['Root', 'Support', 'Student', 'Admin', 'Teacher', 'Reviewer'] as const) {
    if (roles.includes(r)) return r;
  }
  return 'guest';
}

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
    title: 'Mirror',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon32.png',      sizes: '32x32', type: 'image/png' },
      { url: '/icons/mirror-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    // Opaque: iOS renders transparent touch icons on black, Android on white.
    apple: [{ url: '/icons/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' }],
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: PWA_EARLY_CAPTURE_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <AuthInitializer user={user} />
        <SessionCacheGuard userId={user?.id ?? null} />

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
            <InstallPrompt audience={installAudience(user)} />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}