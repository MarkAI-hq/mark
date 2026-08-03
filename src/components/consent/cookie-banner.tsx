'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'mark_analytics_consent'

export type ConsentValue = 'granted' | 'declined'

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(CONSENT_KEY) as ConsentValue) ?? null
}

export function applyConsent(value: ConsentValue) {
  localStorage.setItem(CONSENT_KEY, value)
  if (value === 'granted') {
    posthog.opt_in_capturing()
  } else {
    posthog.opt_out_capturing()
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    if (stored === null) {
      setVisible(true)
    } else {
      // Restore previous choice on every page load
      applyConsent(stored)
    }
  }, [])

  if (!visible) return null

  const accept = () => {
    applyConsent('granted')
    setVisible(false)
  }

  const decline = () => {
    applyConsent('declined')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          We use analytics cookies to understand how teachers use this platform and improve it.
          Your data is never sold.{' '}
          <Link href="/privacy" className="underline underline-offset-2 text-foreground hover:text-foreground">
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline} className="text-muted-foreground">
            Essential only
          </Button>
          <Button size="sm" onClick={accept} className="bg-amber-500 hover:bg-amber-600 text-white border-0">
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  )
}
