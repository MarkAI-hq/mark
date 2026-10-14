// src/components/tracy/usage-remaining-banner.tsx
'use client'

// Free-tier low-balance notice, shown once usageRemaining drops to 3 or
// fewer. Was pasted identically (same copy, same color) into both chat
// pages when the usage-remaining feature shipped; kept here once so the
// next tweak to this notice doesn't need to land in two places again.

export function UsageRemainingBanner({ remaining }: { remaining: number | null }) {
  if (remaining === null || remaining <= 0 || remaining > 3) return null
  return (
    <p className="text-[11px] text-[#b88a1f] dark:text-[#d9ae3d] text-center mt-3">
      {remaining} free message{remaining === 1 ? '' : 's'} left with Tracy.
    </p>
  )
}
