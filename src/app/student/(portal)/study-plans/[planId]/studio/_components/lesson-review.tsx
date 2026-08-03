'use client'

// src/app/student/(portal)/study-plans/[planId]/studio/_components/lesson-review.tsx
//
// Read-only summary of a completed lesson — zips plan.content.scenes with the
// response_snapshot captured at completion time, so a student can see what
// they actually answered instead of the Studio just replaying the lesson as
// if it were fresh.

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  plan: any
  from?: string
}

const SCORED_TYPES = new Set(['probe', 'quiz', 'hint_quiz', 'retrieval_flash', 'phenomenon_story', 'peer_teach'])
const ENGAGEMENT_TYPES = new Set(['pbl_stage', 'whiteboard', 'cornell_notes'])

export function LessonReview({ plan, from }: Props) {
  const scenes: any[] = plan?.content?.scenes ?? []
  const responses: any[] = plan?.response_snapshot ?? []

  // Reached from Learning History, review should return there — not back into
  // this plan's own chooser, which is a different entry point (item 12 fix).
  const backHref = from === 'history'
    ? '/student/learning-history'
    : `/student/study-plans/${plan.id}/studio`

  // A scene can have multiple responses (e.g. retrieval_flash has one per
  // question) — group by sceneIndex.
  const bySceneIndex = new Map<number, any[]>()
  responses.forEach((r) => {
    if (typeof r.sceneIndex !== 'number') return
    const list = bySceneIndex.get(r.sceneIndex) ?? []
    list.push(r)
    bySceneIndex.set(r.sceneIndex, list)
  })

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-4 py-6">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div>
          <h1 className="text-xl font-bold">{plan.topic}</h1>
          <p className="text-sm text-muted-foreground">
            {plan.subject} · Reviewing your answers ({plan.score_after != null ? `${plan.score_after}%` : 'scored'}) — this is read-only.
          </p>
        </div>

        <div className="space-y-2">
          {scenes.map((scene, i) => {
            const sceneResponses = bySceneIndex.get(i) ?? []
            const hasScored = sceneResponses.some((r) => typeof r.correct === 'boolean')
            const allCorrect = hasScored && sceneResponses.every((r) => r.correct !== false)
            const anyWrong = sceneResponses.some((r) => r.correct === false)
            const engaged = ENGAGEMENT_TYPES.has(scene.type) || sceneResponses.length > 0

            return (
              <div key={i} className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {hasScored ? (
                    anyWrong && !allCorrect ? (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{scene.title ?? `Step ${i + 1}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasScored
                      ? sceneResponses.length > 1
                        ? `${sceneResponses.filter((r) => r.correct).length}/${sceneResponses.length} correct`
                        : anyWrong ? 'Answered incorrectly' : 'Answered correctly'
                      : engaged
                        ? 'Completed — no right/wrong answer here'
                        : 'Read-only content, no response needed'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {responses.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            This lesson was completed before per-answer review was available, so only the overall score is on record.
          </p>
        )}

        <div className="flex justify-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/student/study-plans">All lessons</Link>
          </Button>
          <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground">
            <Link href={`/student/study-plans/${plan.id}/studio?mode=practice`}>Retake as refresher</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
