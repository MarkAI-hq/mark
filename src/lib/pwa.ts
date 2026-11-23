// src/lib/pwa.ts
//
// Install-to-home-screen + service-worker cache helpers.
//
// Why the early-capture script: Chromium fires `beforeinstallprompt` once,
// very early in page load — usually before React hydrates — and never again
// for that page view. A useEffect listener alone misses it on most loads, so
// an inline <head> script stashes the event on `window` and the React
// component picks it up from there.

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    __pwaInstallEvent?: BeforeInstallPromptEvent | null
  }
}

export const PWA_INSTALL_EVENT = 'pwa:installable'
export const PWA_INSTALLED_EVENT = 'pwa:installed'

/** Inline script for <head>: captures the install event before hydration. */
export const PWA_EARLY_CAPTURE_SCRIPT = `
window.__pwaInstallEvent = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__pwaInstallEvent = e;
  window.dispatchEvent(new Event('${PWA_INSTALL_EVENT}'));
});
window.addEventListener('appinstalled', function () {
  window.__pwaInstallEvent = null;
  window.dispatchEvent(new Event('${PWA_INSTALLED_EVENT}'));
});
`

export type InstallPlatform =
  | 'native'   // Chromium (Android Chrome, Samsung Internet, desktop Chrome/Edge) — real prompt()
  | 'ios'      // iOS/iPadOS Safari, Chrome, Edge — manual Share → Add to Home Screen
  | 'in-app'   // WhatsApp / Facebook / Instagram etc. webviews — cannot install at all
  | 'none'

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'none'
  const ua = navigator.userAgent
  // In-app browsers first: links shared on WhatsApp/Facebook open here, and
  // they never offer installation on either OS.
  if (/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat|TikTok|; wv\)/i.test(ua)) return 'in-app'
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as desktop Safari
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (window.__pwaInstallEvent) return 'native'
  return 'none'
}

// Caches next-pwa fills with per-user responses (HTML, RSC payloads, /api/*).
// Static asset caches (JS/CSS/fonts/images/precache) are shared and safe.
const USER_SCOPED_CACHES = [
  'pages',
  'pages-rsc',
  'pages-rsc-prefetch',
  'apis',
  'start-url',
  'next-data',
  'others',
]

/**
 * Drop every per-user SW cache. Called whenever the signed-in identity
 * changes (logout, session expiry, a different user on a shared device), so
 * the SW's NetworkFirst fallback — which kicks in offline or after a 10 s
 * network timeout — can never serve one user's pages or API data to another.
 */
export async function clearUserScopedCaches(): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    const names = await caches.keys()
    await Promise.all(
      names.filter(n => USER_SCOPED_CACHES.includes(n)).map(n => caches.delete(n)),
    )
  } catch {
    /* caches can be unavailable (private mode, insecure origin) — nothing to clear */
  }
}
