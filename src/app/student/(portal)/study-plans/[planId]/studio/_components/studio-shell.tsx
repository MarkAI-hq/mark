'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Trophy, PartyPopper, Loader2, Check, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { NextStep } from '@/components/students/next-step'
import { ConnectedProgress } from '@/components/students/connected-progress'
import {
  getNextAction, getStudentSubjectProgress, getStudentPredictions, type NextAction,
} from '@/lib/actions/student-dashboard'
import {
  markStudyPlanComplete, resolveNextInSequence, selfInitiateFromEntry,
  type NextInSequenceResult,
} from '@/lib/actions/study-plans'
import { submitStudentNote } from '@/lib/actions/student-notes'
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
  /** True when this is a refresher retake of an already-completed lesson —
   *  the server computes a score for feedback but records nothing, so the
   *  completion screen must never look like the "for real" one. */
  isPractice?: boolean
}

export function StudioShell({ plan, scenes, user, isPractice }: Props) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [practiceScore, setPracticeScore] = useState<number | null>(null)
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
    masteryLabel?: string | null
    masteryPct?: number | null
    weeksToExam?: number | null
    next: NextAction | null
  } | null>(null)

  // Auto-prompt for a short summary at the end of every lesson — feeds the
  // Knowledge Base alongside everything else the student has written, so the
  // lesson leaves a trace beyond a score.
  const [summary, setSummary] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [summarySaved, setSummarySaved] = useState(false)

  // Same-session auto-advance / daily assessment (item 7). Resolved right
  // alongside the other completion-screen data — never blocks completion if
  // it errors, the student still lands on the normal NextStep fallback.
  const [sequence, setSequence] = useState<NextInSequenceResult | null>(null)
  const [startingExtra, setStartingExtra] = useState(false)

  function handleStartExtra(entryId: string) {
    if (startingExtra) return
    setStartingExtra(true)
    selfInitiateFromEntry(entryId).then(({ data, error }) => {
      setStartingExtra(false)
      if (error || !data?.plan?.id) { toast.error(error?.message ?? 'Could not start the next lesson'); return }
      router.push(`/student/study-plans/${data.plan.id}/studio`)
    })
  }

  function handleSaveSummary() {
    if (!summary.trim() || savingSummary) return
    setSavingSummary(true)
    submitStudentNote({ subject: plan.subject ?? '', topic: plan.topic ?? '', content: summary.trim() })
      .then(({ error }) => {
        if (error) { toast.error(error.message ?? 'Could not save summary'); return }
        setSummarySaved(true)
        toast.success('Summary added to your Knowledge Base')
      })
      .finally(() => setSavingSummary(false))
  }

  const handleComplete = useCallback(
    async (data: { sceneResponses: SceneResponse[]; achievedRefs: string[] }) => {
      setCompleting(true)
      try {
        const res = await markStudyPlanComplete(plan.id, {
          scene_responses: data.sceneResponses,
          outcomes_achieved: data.achievedRefs,
          practice: isPractice,
        })

        if (isPractice) {
          // Nothing was recorded — show the practice score and stop. Fetching
          // "connected progress" here would be misleading since none of it moved.
          setPracticeScore(res?.data?.plan?.score_after ?? null)
          setDone({ next: null })
          return
        }

        toast.success('Lesson complete!')

        const studentId = user?.user_id ?? user?.id
        // Fetch the next action + the connective tissue (subject mastery,
        // exam prediction) in parallel — no dead air, and the completion
        // screen shows how this lesson ladders up instead of a bare score.
        const [next, subjectProgress, predictions, nextInSequence] = await Promise.all([
          getNextAction().catch(() => null),
          studentId ? getStudentSubjectProgress(studentId).catch(() => []) : Promise.resolve([]),
          studentId ? getStudentPredictions(studentId).catch(() => []) : Promise.resolve([]),
          resolveNextInSequence(plan.id).catch(() => null),
        ])
        if (nextInSequence?.data) setSequence(nextInSequence.data)
        const progressEntry = subjectProgress.find((s: any) => s.subject === plan.subject)
        const predictionEntry = predictions.find((p: any) => p.subject === plan.subject)

        setDone({
          predicted_grade: res?.data?.prediction?.predicted_grade ?? predictionEntry?.predicted_grade ?? null,
          trajectory: res?.data?.prediction?.trajectory ?? predictionEntry?.trajectory ?? null,
          masteryLabel: progressEntry?.mastery_label ?? null,
          masteryPct: progressEntry?.avg_percentage ?? null,
          weeksToExam: predictionEntry?.weeks_to_exam ?? null,
          next,
        })
      } catch {
        toast.error('Could not mark as complete. Try again.')
      } finally {
        setCompleting(false)
      }
    },
    [plan.id, plan.subject, user, isPractice],
  )

  // Practice retake — a small, clearly-different screen. No breadcrumb, no
  // summary prompt, no next-action: none of that moved, so showing it would
  // imply this retake counted when it explicitly didn't.
  if (done && isPractice) {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="max-w-md mx-auto w-full space-y-5 py-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Check className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Practice complete</h2>
            <p className="text-sm text-muted-foreground mt-1">{plan.subject}: {plan.topic}</p>
          </div>
          <div className="rounded-xl border bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">Practice score (not recorded)</p>
            <p className="text-2xl font-bold mt-0.5">{practiceScore != null ? `${practiceScore}%` : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your original score of {plan.score_after != null ? `${plan.score_after}%` : 'record'} is unchanged.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/student/study-plans/${plan.id}/studio`}>Back to lesson</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/study-plans">All lessons</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
          </div>

          {/* This lesson doesn't stand alone — show what it fed into */}
          <ConnectedProgress
            topic={plan.topic ?? ''}
            subject={plan.subject ?? ''}
            masteryLabel={done.masteryLabel}
            masteryPct={done.masteryPct}
            predictedGrade={done.predicted_grade}
            trajectory={done.trajectory}
            weeksToExam={done.weeksToExam}
          />

          {/* Auto-prompt for a quick summary — saved straight to the Knowledge Base */}
          {!summarySaved ? (
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-sm font-medium">Write a quick summary of what you learned</p>
              <p className="text-xs text-muted-foreground">2–3 sentences, in your own words — this gets added to your notes.</p>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={`Summarize ${plan.topic ?? 'this lesson'}…`}
                rows={3}
                className="text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSummarySaved(true)}>Skip</Button>
                <Button size="sm" onClick={handleSaveSummary} disabled={!summary.trim() || savingSummary} className="gap-1.5 bg-gold hover:bg-gold/90 text-gold-foreground">
                  {savingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {savingSummary ? 'Saving…' : 'Save to notes'}
                </Button>
              </div>
            </div>
          ) : summary.trim() && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />
              Summary saved to your Knowledge Base
            </div>
          )}

          {/* Same-session auto-advance / daily assessment (item 7) — takes
              priority over the generic NextStep when there's a real next
              step in today's own sequence. */}
          {sequence?.mode === 'auto_continue' && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 text-gold shrink-0" /> Next up: {sequence.topic}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{sequence.subject} · continuing today&apos;s lessons</p>
              </div>
              <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground shrink-0">
                <Link href={`/student/study-plans/${sequence.plan.id}/studio`}>Continue</Link>
              </Button>
            </div>
          )}
          {sequence?.mode === 'day_complete' && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold">Today&apos;s lessons for {plan.subject} are done</p>
              </div>
              <p className="text-xs text-muted-foreground">
                We put together an assessment covering everything you finished today.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground">
                  <Link href={`/student/study-plans/${sequence.assessment_plan.id}/studio`}>Take the assessment</Link>
                </Button>
                {sequence.can_continue_extra && sequence.extra_entry_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={startingExtra}
                    onClick={() => handleStartExtra(sequence.extra_entry_id!)}
                  >
                    {startingExtra ? 'Starting…' : `Keep going: ${sequence.extra_topic}`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* The immediate next action — no dead air */}
          {(!sequence || sequence.mode === 'none') && <NextStep nextAction={done.next} />}

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
