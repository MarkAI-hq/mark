// src/components/providers/posthog-provider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

// ── Boot PostHog once on the client ───────────────────────────────────────────
// Starts opted-out by default; CookieBanner calls posthog.opt_in_capturing()
// after the user grants consent (or restores their previous choice on load).
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:                      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    ui_host:                       'https://us.posthog.com',
    capture_pageview:              false,
    capture_pageleave:             true,
    person_profiles:               'identified_only',
    persistence:                   'localStorage',
    opt_out_capturing_by_default:  true,
    loaded: (ph) => {
      if (process.env.NODE_ENV !== 'production') ph.opt_out_capturing();
    },
  });
}

// ── Pageview tracker (inside Suspense boundary in layout) ─────────────────────
export function PostHogPageview() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) url += `?${searchParams.toString()}`;
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// ── Provider wrapper ──────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}

// ── Identify user (call after login) ─────────────────────────────────────────
export function identifyUser(user: {
  user_id:         string;
  email:           string;
  first_name:      string;
  role:            string;
  organization_id: string;
}) {
  posthog.identify(user.user_id, {
    email:           user.email,
    name:            user.first_name,
    role:            user.role,
    organization_id: user.organization_id,
  });
}

// ── Reset on logout ───────────────────────────────────────────────────────────
export function resetPostHog() {
  posthog.reset();
}