'use client'

// src/components/pwa/install-prompt.tsx
//
// "Install the app" prompt for every kind of visitor — signed-out, new and
// returning users of every role — on every platform that can install:
//   • Chromium (Android Chrome, Samsung Internet, desktop Chrome/Edge):
//     real one-tap install via the captured beforeinstallprompt event.
//   • iOS/iPadOS: no install API exists, so show Share → Add to Home Screen.
//   • WhatsApp/Facebook/Instagram in-app browsers: can't install; tell the
//     user to open the page in their real browser (links are shared there).
// Shown only on landing/login/dashboard pages — never mid-lesson, mid-test or
// mid-wizard — and snoozed for 14 days after "Not now".

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { Download, Share, SquarePlus, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PWA_INSTALL_EVENT,
  PWA_INSTALLED_EVENT,
  detectInstallPlatform,
  isStandalone,
  type InstallPlatform,
} from '@/lib/pwa'

const DISMISS_KEY = 'mirror_pwa_install_dismissed_at'
const CONSENT_KEY = 'mark_analytics_consent' // cookie banner answered → no stacking
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000
const SHOW_DELAY_MS = 2500

const PROMPT_PATHS = new Set([
  '/',
  '/program',
  '/schools',
  '/login',
  '/student/login',
  '/dashboard',
  '/dashboard/teacher',
  '/student/dashboard',
  '/guardian/dashboard',
  '/root',
])

export type InstallAudience = 'guest' | 'Student' | 'Teacher' | 'Admin' | 'Reviewer' | 'Root' | 'Support'

const COPY: Record<InstallAudience, string> = {
  guest:    'Opens like an app and loads faster on slow connections.',
  Student:  'Jump back into your lessons and Tracy in one tap.',
  Teacher:  'Your classes, marking and reports, one tap away.',
  Admin:    'Your school dashboard, one tap away.',
  Reviewer: "Check your child's progress in one tap.",
  Root:     'Platform admin, one tap away.',
  Support:  'Platform support, one tap away.',
}

function snoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return at > 0 && Date.now() - at < SNOOZE_MS
  } catch {
    return false
  }
}

function consentAnswered(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== null
  } catch {
    return true
  }
}

function track(event: string, props: Record<string, unknown>) {
  try {
    posthog.capture(event, props) // no-op when analytics was declined
  } catch {
    /* ignore */
  }
}

export function InstallPrompt({ audience }: { audience: InstallAudience }) {
  const pathname = usePathname()
  const [platform, setPlatform] = useState<InstallPlatform>('none')
  const [open, setOpen] = useState(false)
  const [installing, setInstalling] = useState(false)

  const eligiblePath = PROMPT_PATHS.has(pathname)

  useEffect(() => {
    if (!eligiblePath || isStandalone() || snoozed()) {
      setOpen(false)
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    let poll: ReturnType<typeof setInterval> | undefined

    const tryShow = () => {
      const p = detectInstallPlatform()
      setPlatform(p)
      if (p === 'none') return
      // Wait for the cookie banner to be answered so the two never stack.
      if (!consentAnswered()) {
        if (!poll) {
          poll = setInterval(() => {
            if (!consentAnswered()) return
            clearInterval(poll)
            tryShow()
          }, 1500)
        }
        return
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        setOpen(true)
        track('pwa_install_prompt_shown', { platform: p, audience, path: pathname })
      }, SHOW_DELAY_MS)
    }

    const onInstalled = () => {
      setOpen(false)
      track('pwa_installed', { audience })
    }

    tryShow()
    window.addEventListener(PWA_INSTALL_EVENT, tryShow)
    window.addEventListener(PWA_INSTALLED_EVENT, onInstalled)
    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      window.removeEventListener(PWA_INSTALL_EVENT, tryShow)
      window.removeEventListener(PWA_INSTALLED_EVENT, onInstalled)
    }
  }, [eligiblePath, audience, pathname])

  if (!open || !eligiblePath) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setOpen(false)
    track('pwa_install_prompt_dismissed', { platform, audience })
  }

  const install = async () => {
    const evt = window.__pwaInstallEvent
    if (!evt) return
    setInstalling(true)
    try {
      await evt.prompt()
      const { outcome } = await evt.userChoice
      track('pwa_install_prompt_choice', { outcome, audience })
      // The event is single-use either way.
      window.__pwaInstallEvent = null
      if (outcome === 'dismissed') dismiss()
      else setOpen(false)
    } finally {
      setInstalling(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      /* ignore */
    }
  }

  // On login pages a bottom-right card covers the Sign in button. Dock it to
  // the top on phones and to the bottom-left (the decorative panel, empty
  // there) on desktop.
  const atTop = pathname === '/login' || pathname === '/student/login'

  return (
    <div
      role="dialog"
      aria-label="Install Mirror"
      className={
        'fixed inset-x-3 z-[60] mx-auto max-w-md rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:inset-x-auto ' +
        (atTop
          ? 'top-3 sm:top-auto sm:bottom-4 sm:left-4'
          : 'bottom-3 sm:bottom-4 sm:right-4')
      }
      style={{
        marginTop: atTop ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Install Mirror</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{COPY[audience]}</p>
        </div>
      </div>

      {platform === 'native' && (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>Not now</Button>
          <Button
            size="sm"
            onClick={install}
            disabled={installing}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Install
          </Button>
        </div>
      )}

      {platform === 'ios' && (
        <ol className="mt-3 space-y-1.5 text-sm text-foreground">
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">1.</span> Tap
            <Share className="h-4 w-4 text-sky-500" aria-label="Share" />
            <span className="font-medium">Share</span> in the browser bar
          </li>
          <li className="flex items-center gap-2">
            <span className="text-muted-foreground">2.</span> Choose
            <SquarePlus className="h-4 w-4" aria-hidden />
            <span className="font-medium">Add to Home Screen</span>
          </li>
        </ol>
      )}

      {platform === 'in-app' && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-foreground">
            <ExternalLink className="mr-1 inline h-4 w-4 align-text-bottom" />
            Open this page in <span className="font-medium">Chrome</span> or{' '}
            <span className="font-medium">Safari</span> to install — use the ⋮ or share menu
            and pick &ldquo;Open in browser&rdquo;.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={copyLink}>Copy link</Button>
          </div>
        </div>
      )}
    </div>
  )
}
