'use client'

// Transition alerts (Focus Mode v1, spec §5.6): a Web Audio chime, a PiP flash
// (handled by the provider's `flashUntil`), and a system Notification when the
// page is hidden and permission was granted. Permission is requested only
// after the first completed focus interval, from an explicit button.

import { chime } from './audio'

export const RING_INTERVAL_MS = 30_000
export const RING_MAX_REPEATS = 3

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export interface AlertMessage {
  title: string
  body: string
  kind: 'break' | 'focus'
}

/** Chime always; a system notification only if the page is hidden. */
export function fireAlert(msg: AlertMessage) {
  chime(msg.kind)
  if (
    notificationsSupported() &&
    Notification.permission === 'granted' &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'hidden'
  ) {
    try {
      const n = new Notification(msg.title, {
        body: msg.body,
        tag: 'mirror-focus',
        silent: true, // our own chime already played
      })
      n.onclick = () => {
        window.focus()
        n.close()
      }
    } catch {
      /* some platforms only allow notifications from a service worker */
    }
  }
}

/**
 * Ring mode: repeat the chime every 30 s until acknowledged, max 3 repeats.
 * Returns a cancel function. `onDone` fires when it stops by itself.
 */
export function startRing(kind: 'break' | 'focus', onDone?: () => void): () => void {
  let repeats = 0
  const id = window.setInterval(() => {
    repeats++
    chime(kind)
    if (repeats >= RING_MAX_REPEATS) {
      window.clearInterval(id)
      onDone?.()
    }
  }, RING_INTERVAL_MS)
  return () => window.clearInterval(id)
}
