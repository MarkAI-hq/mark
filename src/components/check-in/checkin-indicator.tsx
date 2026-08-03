'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getCheckInTime } from '@/lib/checkin'

/** Persistent "checked in at HH:MM" indicator — lives in the header so it's
 *  visible across the whole platform, not just on the page the popup fired on. */
export function CheckInIndicator({ userId }: { userId?: string }) {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setTime(getCheckInTime(userId))
    const id = setInterval(() => setTime(getCheckInTime(userId)), 30000)
    return () => clearInterval(id)
  }, [userId])

  if (!time) return null
  const label = new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <span
      title={`Checked in at ${label}`}
      className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground px-1"
    >
      <Clock className="h-3 w-3" /> {label}
    </span>
  )
}
