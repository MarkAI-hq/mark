// src/app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { CookiesProvider } from 'next-client-cookies/server';

import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { cn } from '@/lib/utils';

// --- NEW IMPORTS ---
import { getSession } from '@/lib/session';
import { AuthInitializer } from '@/components/auth/auth-initializer';
// --- END NEW IMPORTS ---

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mark AI: Learning Improvement System',
  description: 'AI Powered Learning Intelligence and Improvement System.',
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
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          geistSans.variable,
          geistMono.variable,
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
          <Toaster position="bottom-right" richColors /> {/* CHANGED: Using Sonner Toaster with props */}
        </ThemeProvider>
      </body>
    </html>
  );
}
