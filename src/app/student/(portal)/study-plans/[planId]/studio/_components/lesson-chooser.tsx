'use client'

// src/app/student/(portal)/study-plans/[planId]/studio/_components/lesson-chooser.tsx
//
// Shown instead of silently re-running the Studio when a student opens a
// lesson that's already completed. Previously reopening a completed plan
// just replayed it as if fresh — confusing, and if finished again it would
// have double-counted mastery/streak (now blocked server-side too).

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConnectedProgress } from '@/components/students/connected-progress'
import { getStudentSubjectProgress, getStudentPredictions } from '@/lib/actions/student-dashboard'

interface Props {
  plan: any
  user: any
  from?: string
}

export function LessonChooser({ plan, user, from }: Props) {
  const fromQuery = from ? `&from=${encodeURIComponent(from)}` : ''
  const closeHref = from === 'history' ? '/student/learning-history' : '/student/study-plans'
  const [progress, setProgress] = useState<{ masteryLabel?: string | null; masteryPct?: number | null } | null>(null)
  const [prediction, setPrediction] = useState<{ predicted_grade?: string | null; trajectory?: string | null; weeks_to_exam?: number | null } | null>(null)

  useEffect(() => {
    const studentId = user?.user_id ?? user?.id
    if (!studentId) return
    getStudentSubjectProgress(studentId).then((list) => {
      const entry = list.find((s: any) => s.subject === plan.subject)
      if (entry) setProgress({ masteryLabel: entry.mastery_label, masteryPct: entry.avg_percentage })
    })
    getStudentPredictions(studentId).then((list) => {
      const entry = list.find((p: any) => p.subject === plan.subject)
      if (entry) setPrediction(entry)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full space-y-5 py-8">
        <Link href={closeHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" /> Close
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Already completed</p>
          <h1 className="text-xl font-bold mt-1">{plan.topic}</h1>
          <p className="text-sm text-muted-foreground">
            {plan.subject}
            {plan.score_after != null ? ` · scored ${plan.score_after}%` : ''}
            {plan.completed_at ? ` · ${new Date(plan.completed_at).toLocaleDateString()}` : ''}
          </p>
        </div>

        <ConnectedProgress
          topic={plan.topic ?? ''}
          subject={plan.subject ?? ''}
          masteryLabel={progress?.masteryLabel}
          masteryPct={progress?.masteryPct}
          predictedGrade={prediction?.predicted_grade}
          trajectory={prediction?.trajectory}
          weeksToExam={prediction?.weeks_to_exam}
        />

        <p className="text-sm text-muted-foreground">
          This lesson&apos;s score already counted toward the numbers above. What would you like to do?
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link href={`/student/study-plans/${plan.id}/studio?mode=review${fromQuery}`}>
            <div className="rounded-xl border p-4 h-full hover:border-gold/40 transition-colors">
              <Eye className="h-5 w-5 text-gold mb-2" />
              <p className="font-medium text-sm">Review my answers</p>
              <p className="text-xs text-muted-foreground mt-1">
                See what you answered on each question, read-only. Doesn&apos;t change your score.
              </p>
            </div>
          </Link>
          <Link href={`/student/study-plans/${plan.id}/studio?mode=practice`}>
            <div className="rounded-xl border p-4 h-full hover:border-gold/40 transition-colors">
              <RotateCcw className="h-5 w-5 text-gold mb-2" />
              <p className="font-medium text-sm">Retake as a refresher</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go through the whole lesson again for practice. Your original score is kept — this one isn&apos;t recorded.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
