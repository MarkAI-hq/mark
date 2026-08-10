'use client'

// Lightweight client-side check-in tracking (item 15). Not a backend feature —
// login itself is already logged server-side (auth.service.ts logActivity);
// this is purely the "seen once a day, stays visible, saved on checkout"
// presentation layer, so it works identically for students, teachers, and
// admins without a new backend surface.

const QUOTES = [
  "Small steps every day add up to big change.",
  "You don't have to be perfect, just consistent.",
  "Every lesson you finish is proof you're capable.",
  "Progress, not perfection.",
  "The work you do today is the person you become tomorrow.",
  "Mistakes are just proof you're trying.",
  "Your only competition is who you were yesterday.",
  "Discipline is choosing what you want most over what you want now.",
  "Growth is uncomfortable — that's how you know it's working.",
  "Show up today. That's the whole job.",
  "You're not behind. You're exactly where your journey needs you to be.",
  "One honest hour of focus beats a whole day of distraction.",
]

interface CheckInEntry {
  date: string
  checkin: string
  checkout: string | null
}

function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function todaysQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

/** Login should congratulate on something real (the student's own streak),
 *  not a generic quote — students have that concept, teachers/admins don't,
 *  so callers without a streak keep using todaysQuote() instead. */
export function congratsMessage(streak: number): string {
  if (streak <= 0) return "Ready to start today strong?"
  if (streak === 1) return "You started your streak yesterday — keep it alive today!"
  if (streak < 7) return `${streak} days in a row! You're building real momentum — keep going.`
  if (streak < 14) return `A full week strong — ${streak} days straight. That's real discipline.`
  if (streak < 30) return `${streak} days in a row! That kind of consistency is what actually moves the needle.`
  return `${streak} days straight?! That's serious dedication — genuinely impressive.`
}

export function shouldShowCheckIn(userId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(`checkin_shown_${userId}`) !== dateKey()
  } catch {
    return false
  }
}

/** Marks today as checked-in and appends to a rolling 14-day history. */
export function recordCheckIn(userId: string): string {
  const now = new Date().toISOString()
  try {
    localStorage.setItem(`checkin_shown_${userId}`, dateKey())
    localStorage.setItem(`checkin_time_${userId}`, now)
    const historyRaw = localStorage.getItem(`checkin_history_${userId}`)
    const history: CheckInEntry[] = historyRaw ? JSON.parse(historyRaw) : []
    history.push({ date: dateKey(), checkin: now, checkout: null })
    localStorage.setItem(`checkin_history_${userId}`, JSON.stringify(history.slice(-14)))
  } catch {}
  return now
}

/** Best-effort — called right before logout clears the session. */
export function recordCheckOut(userId: string): void {
  try {
    const now = new Date().toISOString()
    const historyRaw = localStorage.getItem(`checkin_history_${userId}`)
    if (!historyRaw) return
    const history: CheckInEntry[] = JSON.parse(historyRaw)
    const todayEntry = history.find((h) => h.date === dateKey())
    if (todayEntry) todayEntry.checkout = now
    localStorage.setItem(`checkin_history_${userId}`, JSON.stringify(history))
  } catch {}
}

export function getCheckInTime(userId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`checkin_time_${userId}`)
  } catch {
    return null
  }
}
