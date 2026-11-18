'use client'

// Exam countdown (Focus Mode v1, spec §6). Server-owned deadline, displayed
// with clock-drift correction. While mounted it holds the focus exam lock:
// the active focus session is paused, focus audio silenced and the dock
// hidden. The learner may resume focus afterwards; it never auto-resumes.
// At zero it calls `onExpire` (the host saves the current answer); the
// server's delayed job is the real guarantee that the attempt is submitted.

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlarmClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chime } from '@/lib/focus/audio'
import { formatClock } from '@/lib/focus/engine'
import { clockOffset, crossedWarnings, examRemainingMs } from '@/lib/focus/exam-clock'
import { startTicker } from '@/lib/focus/ticker'
import { useOptionalFocus } from './focus-provider'

export interface ExamClockInput {
  deadline_at: string | null
  server_now: string
}

/** Remaining ms for a timed submission, or null when untimed. */
export function useExamCountdown(
  submission: ExamClockInput | null,
  opts: { onWarning?: (minutes: number) => void; onExpire?: () => void } = {},
) {
  const offset = useRef(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const prev = useRef<number | null>(null)
  const expired = useRef(false)
  const cbs = useRef(opts)
  cbs.current = opts

  const deadline = submission?.deadline_at ?? null
  const serverNow = submission?.server_now ?? null

  useEffect(() => {
    if (!deadline || !serverNow) {
      setRemaining(null)
      return
    }
    offset.current = clockOffset(serverNow, Date.now())
    prev.current = null
    expired.current = false
    const tick = () => {
      const r = examRemainingMs(deadline, Date.now(), offset.current)
      if (prev.current != null) {
        for (const m of crossedWarnings(prev.current, r)) cbs.current.onWarning?.(m)
      }
      prev.current = r
      setRemaining(r)
      if (r <= 0 && !expired.current) {
        expired.current = true
        cbs.current.onExpire?.()
      }
    }
    tick()
    return startTicker(tick, 1000)
  }, [deadline, serverNow])

  return remaining
}

export function ExamCountdown({
  submission,
  onExpire,
  className,
}: {
  submission: ExamClockInput
  /** Save the current answer; the server auto-submits regardless. */
  onExpire?: () => void | Promise<void>
  className?: string
}) {
  const focus = useOptionalFocus()
  const lockForExam = focus?.lockForExam
  const [timeUp, setTimeUp] = useState(false)

  // Hold the exam lock while mounted.
  useEffect(() => {
    if (!lockForExam) return
    return lockForExam()
  }, [lockForExam])

  const remaining = useExamCountdown(submission, {
    onWarning: (m) => {
      chime('warning')
      toast.warning(m === 1 ? '1 minute left' : `${m} minutes left`, {
        description: 'Your answers are saved as you go.',
      })
    },
    onExpire: async () => {
      setTimeUp(true)
      try {
        await onExpire?.()
      } finally {
        chime('warning')
        toast.info('Time is up, your answers were submitted')
      }
    },
  })

  if (remaining == null) return null
  const low = remaining <= 5 * 60_000

  return (
    <div
      role="timer"
      aria-live={low ? 'assertive' : 'off'}
      className={cn(
        'sticky top-0 z-30 flex items-center justify-center gap-2 border-b px-4 py-2 text-sm font-medium backdrop-blur',
        timeUp
          ? 'bg-muted text-muted-foreground'
          : low
            ? 'bg-red-50/95 text-red-900 dark:bg-red-950/90 dark:text-red-100'
            : 'bg-background/95',
        className,
      )}
    >
      <AlarmClock className="h-4 w-4" />
      {timeUp ? (
        <span>Time is up, your answers were submitted</span>
      ) : (
        <>
          <span>Time left</span>
          <span className="font-mono text-base font-bold tabular-nums">{formatClock(remaining)}</span>
        </>
      )}
    </div>
  )
}
