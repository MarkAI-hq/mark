'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Sparkles, Target, Trophy, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { selfInitiateStudyPlan, type NextAction } from '@/lib/actions/student-dashboard'
import { AskTracyChip } from '@/components/students/ask-tracy-chip'

/**
 * The Next-Best-Action hero — "total mental clarity".
 * Answers, in one card: DO THIS NOW · IT GETS YOU THIS · YOU vs YOUR GOAL.
 */
export function NextStep({ nextAction }: { nextAction: NextAction | null }) {
  const router = useRouter()
  const [starting, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  if (!nextAction) return null
  const { action, why, outcome_if_done, goal_state, cta } = nextAction

  function start() {
    if (!action || busy) return
    setBusy(true)
    startTransition(async () => {
      const { data, error } = await selfInitiateStudyPlan(action!.sow_entry_id)
      setBusy(false)
      if (error) {
        toast.error(error.message ?? 'Could not start lesson')
        return
      }
      if (data?.plan_id) router.push(`/student/study-plans/${data.plan_id}/studio`)
    })
  }

  // Goal-reached celebration state.
  if (goal_state?.goal_reached) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-5">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              On track for your {goal_state.goal_grade} in {goal_state.subject}!
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              You&apos;re predicted {goal_state.predicted_grade}
              {goal_state.milestone_label ? ` for ${goal_state.milestone_label}` : ''}. Keep it locked in.
            </p>
          </div>
        </div>
        {action && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/60 dark:bg-black/20 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Keep your edge — do this next</p>
              <p className="text-sm font-medium truncate">{action.subject}: {action.topic}</p>
            </div>
            <Button size="sm" className="shrink-0 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={start} disabled={busy || starting}>
              <Sparkles className="h-3.5 w-3.5" />{busy ? 'Starting…' : 'Start'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5">
      {/* Goal header — you vs your goal */}
      {goal_state && (
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-gold" />
            <span>
              Goal: <span className="font-semibold text-foreground">{goal_state.goal_grade ?? '—'}</span>
              {goal_state.milestone_label ? ` · ${goal_state.milestone_label}` : ''}
              {goal_state.weeks_to_exam != null ? ` · ${goal_state.weeks_to_exam} wk${goal_state.weeks_to_exam === 1 ? '' : 's'} left` : ''}
            </span>
          </div>
          {goal_state.predicted_grade && (
            <span className="text-xs">
              Now: <span className="font-semibold">{goal_state.predicted_grade}</span>
              {goal_state.gap_to_next_grade && goal_state.gap_to_next_grade > 0 && goal_state.next_grade
                ? ` · +${goal_state.gap_to_next_grade}% to ${goal_state.next_grade}`
                : ''}
            </span>
          )}
        </div>
      )}

      {/* The one action */}
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">Do this now</p>

      {action ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{action.topic}</p>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{action.subject}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{action.estimated_minutes} min</span>
              </p>
            </div>
            <Button className="shrink-0 gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground" onClick={start} disabled={busy || starting}>
              <Sparkles className="h-4 w-4" />{busy ? 'Starting…' : 'Start now'}
            </Button>
          </div>
          {/* Why + outcome */}
          <div className="mt-3 space-y-1.5">
            {why && <p className="text-xs text-muted-foreground">{why}</p>}
            {outcome_if_done && (
              <p className="text-xs font-medium text-foreground flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {outcome_if_done}
              </p>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <AskTracyChip
              label="Not sure where to start? Ask Tracy"
              prompt={`Before I start "${action.topic}" in ${action.subject}, can you give me a quick heads-up on what to focus on?`}
            />
          </div>
        </>
      ) : (
        /* No active work — never a blank screen */
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{why}</p>
          {cta && (
            <Button asChild className="shrink-0 gap-1 bg-gold hover:bg-gold/90 text-gold-foreground">
              <Link href={cta.href}>{cta.label}<ArrowRight className="h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
