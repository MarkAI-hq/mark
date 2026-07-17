'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Trophy, TrendingUp, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { NextStep } from '@/components/students/next-step'
import { getNextAction, type NextAction } from '@/lib/actions/student-dashboard'
import { markStudyPlanComplete } from '@/lib/actions/study-plans'
import { LessonPlayer, type SceneResponse } from './lesson-player'

// ── Component ─────────────────────────────────────────────────────────────────
//
// The studio shell wraps the reusable {@link LessonPlayer} with everything that
// is specific to a *saved* study plan: completion persistence, the predicted-grade
// celebration, and the immediate next action. The scene-by-scene experience itself
// lives in LessonPlayer so it's identical here and in onboarding.

interface Props {
  plan:   any
  scenes: any[]
  user:   any
}

export function StudioShell({ plan, scenes }: Props) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  // Session sequencing hint (set server-side when a topic's full outcome set
  // didn't fit in one session) — { index, of_estimate }. Absent/of_estimate<=1
  // means this is a single-session topic; no badge shown.
  const sessionHint = (plan.content as any)?.session_hint as
    | { index: number; of_estimate: number }
    | undefined
  const continuesNextSession = !!sessionHint && sessionHint.index < sessionHint.of_estimate
  // Completion screen: outcome of this lesson + the immediate next action (no dead air).
  const [done, setDone] = useState<{
    predicted_grade?: string | null
    trajectory?: string | null
    next: NextAction | null
  } | null>(null)

  const handleComplete = useCallback(
    async (data: { sceneResponses: SceneResponse[]; achievedRefs: string[] }) => {
      setCompleting(true)
      try {
        const res = await markStudyPlanComplete(plan.id, {
          scene_responses: data.sceneResponses,
          outcomes_achieved: data.achievedRefs,
        })
        toast.success('Lesson complete!')
        // Fetch the next action so the completion screen has no dead air.
        const next = await getNextAction().catch(() => null)
        setDone({
          predicted_grade: res?.data?.prediction?.predicted_grade ?? null,
          trajectory: res?.data?.prediction?.trajectory ?? null,
          next,
        })
      } catch {
        toast.error('Could not mark as complete. Try again.')
      } finally {
        setCompleting(false)
      }
    },
    [plan.id],
  )

  // Completion screen — celebrate the outcome, then the immediate next action.
  if (done) {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full space-y-5 py-6">
          <div className="text-center">
            <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-3 ${
              continuesNextSession
                ? 'bg-gold/10'
                : 'bg-emerald-100 dark:bg-emerald-900/40'
            }`}>
              {continuesNextSession
                ? <PartyPopper className="h-7 w-7 text-gold" />
                : <Trophy className="h-7 w-7 text-emerald-600" />}
            </div>
            <h2 className="text-xl font-bold">
              {continuesNextSession
                ? `Part ${sessionHint!.index} done — continues next session`
                : 'Lesson complete!'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{plan.subject}: {plan.topic}</p>
            {continuesNextSession && (
              <p className="text-xs text-muted-foreground mt-1">
                {sessionHint!.of_estimate - sessionHint!.index} more session{sessionHint!.of_estimate - sessionHint!.index === 1 ? '' : 's'} to cover everything on this topic
              </p>
            )}
            {done.predicted_grade && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
                Predicted grade now {done.predicted_grade}
                {done.trajectory ? ` · ${done.trajectory}` : ''}
              </div>
            )}
          </div>

          {/* The immediate next action — no dead air */}
          <NextStep nextAction={done.next} />

          <div className="flex items-center justify-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/student/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/study-plans">All lessons</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No-scenes fallback — the plan has flat content but no generated scenes.
  if (scenes.length === 0) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit gap-1">
          <X className="h-4 w-4" /> Exit
        </Button>
        <div className="rounded-2xl border bg-card p-6 max-w-2xl mx-auto w-full">
          <h2 className="font-bold text-xl">{plan.topic}</h2>
          <p className="text-sm text-muted-foreground mt-1">{plan.subject}</p>
          <div className="mt-4 space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>{plan.content?.introduction}</p>
            <p>{plan.content?.explanation}</p>
          </div>
          <Button
            className="mt-6 bg-gold hover:bg-gold/90 text-gold-foreground"
            onClick={() => handleComplete({ sceneResponses: [], achievedRefs: [] })}
            disabled={completing}
          >
            {completing ? 'Completing…' : 'Mark as Complete'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <LessonPlayer
      scenes={scenes}
      planId={plan.id}
      subject={plan.subject ?? ''}
      topic={plan.topic ?? ''}
      completeLabel="Complete"
      onComplete={handleComplete}
      onExit={() => router.back()}
      sessionHint={sessionHint}
    />
  )
}
