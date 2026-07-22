'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'mi_compass_promo_shown'
const MOBILE_SCROLL_THRESHOLD = 0.65
const MOBILE_TIMER_MS = 45_000

/**
 * Promotes the free Learning Compass without being the first thing a visitor
 * sees — fires on desktop exit-intent (mouse leaving toward the top of the
 * viewport) or, since there's no mouse-leave signal on touch devices, after
 * meaningful engagement (65% scroll depth or 45s dwell, whichever first).
 * Shown at most once per browser session.
 */
export function ExitIntentCompassModal() {
  const [open, setOpen] = useState(false)
  const shownRef = useRef(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      shownRef.current = true
      return
    }

    function trigger() {
      if (shownRef.current) return
      shownRef.current = true
      sessionStorage.setItem(STORAGE_KEY, '1')
      setOpen(true)
    }

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) trigger()
    }

    function handleScroll() {
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      if (total > 0 && scrolled / total >= MOBILE_SCROLL_THRESHOLD) trigger()
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })
    const timer = setTimeout(trigger, MOBILE_TIMER_MS)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
            <Compass className="h-6 w-6 text-gold" />
          </div>
          <DialogTitle className="text-xl">Before you go — know how you learn</DialogTitle>
          <DialogDescription>
            Take the free, two-minute Learning Compass. Get your learning profile and a matched
            toolkit — no sign-up required.
          </DialogDescription>
        </DialogHeader>
        <Button asChild variant="gold" size="lg" className="w-full font-bold" onClick={() => setOpen(false)}>
          <Link href="/learning-compass">
            Take the free Learning Compass <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
