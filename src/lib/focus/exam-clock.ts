// Pure exam-clock maths (spec §6). The server owns the deadline; the client
// only displays it, corrected for its own clock drift:
//   offset    = server_now − Date.now()   (computed once, on load)
//   remaining = deadline_at − (Date.now() + offset)

export const WARNING_MINUTES = [30, 10, 5, 1] as const

export function clockOffset(serverNowIso: string, clientNow: number): number {
  const t = new Date(serverNowIso).getTime()
  return Number.isFinite(t) ? t - clientNow : 0
}

export function examRemainingMs(deadlineIso: string, clientNow: number, offset: number): number {
  return Math.max(0, new Date(deadlineIso).getTime() - (clientNow + offset))
}

/**
 * Warnings newly crossed between two readings. Returns the minute marks whose
 * threshold lies in (next, prev] — so a reload at 7 minutes left does not
 * replay the 30- and 10-minute warnings, only marks crossed while watching.
 */
export function crossedWarnings(prevMs: number, nextMs: number): number[] {
  return WARNING_MINUTES.filter((m) => {
    const at = m * 60_000
    return prevMs > at && nextMs <= at
  })
}
