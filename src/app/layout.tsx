// src/app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { CookiesProvider } from 'next-client-cookies/server';

import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { cn } from '@/lib/utils';

// --- NEW IMPORTS ---
import { getSession } from '@/lib/session';
import { AuthInitializer } from '@/components/auth/auth-initializer';
// --- END NEW IMPORTS ---

export const metadata: Metadata = {
  title: 'Mirror Intelligence',
  description: 'Teaching Intelligence, Learning Intelligence, and School Insights — in one closed-loop platform.',
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

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CookiesProvider>{children}</CookiesProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}