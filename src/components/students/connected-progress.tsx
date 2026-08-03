// src/components/students/connected-progress.tsx
//
// Nothing in the portal should feel like a standalone activity — a lesson
// belongs to a subject, a subject's mastery feeds a national-exam prediction,
// and that prediction is what the student is actually working toward. All of
// that is already computed server-side (prediction service recalculates on
// every lesson completion); this component is purely a visibility layer that
// renders the existing chain, not a new analytics system.

import { ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface ConnectedProgressProps {
  topic: string
  subject: string
  masteryLabel?: string | null
  masteryPct?: number | null
  predictedGrade?: string | null
  trajectory?: string | null
  weeksToExam?: number | null
  examLabel?: string
}

const masteryColor: Record<string, string> = {
  strong: 'text-emerald-600',
  developing: 'text-amber-600',
  at_risk: 'text-orange-600',
  critical: 'text-rose-600',
}

export function ConnectedProgress({
  topic,
  subject,
  masteryLabel,
  masteryPct,
  predictedGrade,
  trajectory,
  weeksToExam,
  examLabel = 'UNEB',
}: ConnectedProgressProps) {
  const TrendIcon = trajectory === 'improving' ? TrendingUp : trajectory === 'declining' ? TrendingDown : Minus

  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        How this fits in
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        <span className="font-medium truncate max-w-[140px]" title={topic}>{topic}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="flex items-center gap-1">
          <span className="font-medium">{subject}</span>
          {masteryPct != null && (
            <span className={masteryLabel ? masteryColor[masteryLabel] ?? '' : ''}>
              ({masteryPct}% mastery)
            </span>
          )}
        </span>
        {predictedGrade && (
          <>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-xs font-medium text-gold">
              <TrendIcon className="h-3 w-3" />
              {examLabel} predicted: {predictedGrade}
              {weeksToExam != null ? ` · ${weeksToExam}wk${weeksToExam === 1 ? '' : 's'}` : ''}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
