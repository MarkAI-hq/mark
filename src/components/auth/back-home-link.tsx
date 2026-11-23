'use client'

// "Back to home" on the sign-in pages. Inside the installed app, home is the
// role chooser (/app), not the marketing landing page — the landing page has
// no route to the student portal on the platform domain.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { isStandalone } from '@/lib/pwa'

export function BackHomeLink() {
  const [standalone, setStandalone] = useState(false)
  useEffect(() => setStandalone(isStandalone()), [])

  return (
    <Link
      href={standalone ? '/app?choose=1' : '/'}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {standalone ? 'Switch account type' : 'Back to home'}
    </Link>
  )
}
