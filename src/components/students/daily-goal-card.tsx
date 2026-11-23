'use client'

// "Today's goal" (#3). A specific, time-bound goal beats "do your best"
// (goal-setting research), and seeing progress toward it sustains effort.
// Built on the existing rolling daily plan (WS5): target minutes come from the
// student's own weekly target, minutes are logged by Focus sessions and by
// lesson completion, and today's planned lessons name the concrete work.
// With no weekly target set, the goal falls back to today's lesson queue.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTopicTitle } from '@/lib/utils'
import { getRollingSchedule, type RollingWindow } from '@/lib/actions/study-plans'
import { useOptionalFocus } from '@/components/focus/focus-provider'

interface PlanLike {
  status: string
  topic: string
  subject: string
  completed_at?: string | null
  content?: { estimated_minutes?: number; scenes?: { type?: string }[] } | null
}

const SCORED = new Set(['probe', 'quiz', 'hint_quiz', 'retrieval_flash', 'phenomenon_story', 'peer_teach', 'interactive', 'outcomes_check'])

function questionsIn(plan: PlanLike): number {
  return (plan.content?.scenes ?? []).filter((s) => s?.type && SCORED.has(s.type)).length
}

function isToday(iso?: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export function DailyGoalCard({ plans }: { plans: PlanLike[] }) {
  const focus = useOptionalFocus()
  const phase = focus?.view.phase
  const [win, setWin] = useState<RollingWindow | null>(null)

  useEffect(() => {
    // Refresh after a focus session ends — it just logged minutes.
    if (phase && phase !== 'idle') return
    let alive = true
    getRollingSchedule()
      .then(({ data }) => alive && setWin(data ?? null))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [phase])

  const doneToday = plans.filter((p) => p.status === 'completed' && isToday(p.completed_at))
  const queue = plans.filter((p) => p.status === 'pending' || p.status === 'sent')

  const today = win?.today ?? null
  const hasTarget = !!win?.has_weekly_target && !!today && today.target_minutes > 0
  const targetMin = hasTarget
    ? today!.target_minutes + (today!.carried_in_minutes ?? 0)
    : Math.min(60, queue.slice(0, 2).reduce((s, p) => s + (p.content?.estimated_minutes ?? 20), 0) +
        doneToday.reduce((s, p) => s + (p.content?.estimated_minutes ?? 20), 0))
  const loggedMin = hasTarget
    ? today!.logged_minutes
    : doneToday.reduce((s, p) => s + (p.content?.estimated_minutes ?? 20), 0)

  // Concrete work for the rest of today: the plan's lessons if it has them,
  // otherwise the next one or two in the queue.
  const nextWork = (today?.planned_lessons?.length
    ? today.planned_lessons.map((l) => ({ topic: l.topic, minutes: l.estimated_minutes, questions: null as number | null }))
    : queue.slice(0, 2).map((p) => ({ topic: p.topic, minutes: p.content?.estimated_minutes ?? 20, questions: questionsIn(p) }))
  ).slice(0, 2)

  if (!targetMin && !nextWork.length && !doneToday.length) return null

  const pct = targetMin ? Math.min(100, Math.round((loggedMin / targetMin) * 100)) : 0
  const met = targetMin > 0 && loggedMin >= targetMin
  const remaining = Math.max(0, targetMin - loggedMin)
  const questionsDone = doneToday.reduce((s, p) => s + questionsIn(p), 0)
  const questionsNext = nextWork.reduce((s, w) => s + (w.questions ?? 0), 0)

  const sentence = met
    ? 'Goal met for today — anything more is a bonus.'
    : nextWork.length
      ? `Finish ${remaining || nextWork[0].minutes} min on ${nextWork.map((w) => formatTopicTitle(w.topic)).join(' and ')}${
          questionsNext ? ` and answer ${questionsNext} questions` : ''
        }.`
      : `${remaining} more minutes of study to hit today's goal.`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-gold" />
          Today&apos;s goal
        </CardTitle>
        <CardDescription className="[overflow-wrap:anywhere]">{sentence}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {targetMin > 0 && (
          <div>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium tabular-nums">
                {loggedMin} / {targetMin} min
              </span>
              {met ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Check className="h-3 w-3" /> Done
                </span>
              ) : (
                <span className="text-muted-foreground tabular-nums">{pct}%</span>
              )}
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={targetMin}
              aria-valuenow={Math.min(loggedMin, targetMin)}
              aria-label="Minutes studied today"
            >
              <div className={`h-full rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {doneToday.length} lesson{doneToday.length === 1 ? '' : 's'} done today
          {questionsDone ? ` · ${questionsDone} questions answered` : ''}
          {!hasTarget && (
            <>
              {' · '}
              <Link href="/student/schedule" className="underline-offset-2 hover:text-gold hover:underline">
                set a weekly goal
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
