'use client'

// src/components/pwa/session-cache-guard.tsx
//
// Mounted once in the root layout, so it covers every logout path (staff
// logout, studentLogout, guardian/root shells, account deletion) plus session
// expiry and user-switching on a shared device — without each button having
// to remember to clear caches itself.

import { useEffect } from 'react'
import { clearUserScopedCaches } from '@/lib/pwa'

const LAST_USER_KEY = 'mirror_pwa_last_user'

export function SessionCacheGuard({ userId }: { userId: string | null }) {
  useEffect(() => {
    const current = userId ?? ''
    let previous: string | null = null
    try {
      previous = localStorage.getItem(LAST_USER_KEY)
    } catch {
      return // storage blocked — the SW caches are also unlikely to be usable
    }
    // previous === null is a device that has never run this guard: its caches
    // may already hold someone's data, so treat it as a change too.
    if (previous !== current) {
      void clearUserScopedCaches()
    }
    try {
      localStorage.setItem(LAST_USER_KEY, current)
    } catch {
      /* ignore */
    }
  }, [userId])

  return null
}
