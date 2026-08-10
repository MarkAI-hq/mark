'use client'

// Persistent streak indicator — lives in the student shell header so it
// travels with the learner across every page, not just the school/leaderboard
// tab where the underlying number already existed (item 8: streak should
// "always be with the learner"). Reuses `user.study_streak`, already present
// on the session cookie and already rendered elsewhere (school-client.tsx) —
// no new API call.

import Link from 'next/link'
import { StreakMascot, moodForStreak } from '@/components/students/streak-mascot'

export function StreakBadge({ streak }: { streak: number | null | undefined }) {
  const days = streak ?? 0
  if (days <= 0) return null

  return (
    <Link
      href="/student/school?tab=leaderboard"
      title={`${days} day${days === 1 ? '' : 's'} study streak`}
      data-tour="streak-badge"
      className="flex items-center gap-1 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 pl-1 pr-2.5 py-1 text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
    >
      <StreakMascot mood={moodForStreak(days)} size={22} />
      {days}
    </Link>
  )
}
