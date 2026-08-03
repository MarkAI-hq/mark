'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { shouldShowCheckIn, recordCheckIn, todaysQuote } from '@/lib/checkin'

/** Once-a-day welcome popup (item 15) — same component for students, teachers,
 *  and admins. Login/timestamp is already logged server-side; this only
 *  handles the "seen once today" presentation + local check-in record that
 *  the persistent header indicator reads from. */
export function WelcomeCheckIn({ userId, firstName }: { userId?: string; firstName?: string }) {
  const [open, setOpen] = useState(false)
  const [quote, setQuote] = useState('')

  useEffect(() => {
    if (!userId) return
    if (shouldShowCheckIn(userId)) {
      recordCheckIn(userId)
      setQuote(todaysQuote())
      setOpen(true)
    }
  }, [userId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto h-11 w-11 rounded-full bg-gold/10 flex items-center justify-center mb-1">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <DialogTitle className="text-center">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center leading-relaxed px-2">{quote}</p>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setOpen(false)} className="bg-gold hover:bg-gold/90 text-gold-foreground">
            Let&apos;s go
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
