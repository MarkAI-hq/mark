'use client'

// src/components/prediction/national-exam-prediction-card.tsx
// N5: National exam prediction card — shown on student dashboard, teacher student profile, etc.

import { TrendingUp, TrendingDown, Minus, Target, ArrowRight } from 'lucide-react'
import { Badge }     from '@/components/ui/badge'
import { Button }    from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { StudentNationalExamPrediction } from '@/lib/actions/prediction'

interface NationalExamPredictionCardProps {
  prediction:  StudentNationalExamPrediction
  compact?:    boolean   // teacher view — show just the summary pill
  showPathway?: boolean
}

function gradeColor(grade: string, label: string): string {
  const g = parseInt(grade)
  if (!isNaN(g)) {
    if (g <= 3) return 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
    if (g <= 6) return 'border-l-amber-500  bg-amber-50/30 dark:bg-amber-950/20'
    return          'border-l-rose-500   bg-rose-50/30 dark:bg-rose-950/20'
  }
  // UACE letter grades
  if (['A', 'B', 'C'].includes(grade)) return 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
  if (['D', 'E'].includes(grade))      return 'border-l-amber-500  bg-amber-50/30 dark:bg-amber-950/20'
  return                                       'border-l-rose-500   bg-rose-50/30 dark:bg-rose-950/20'
}

function TrajectoryBadge({ trajectory, delta }: { trajectory: string; delta: number }) {
  if (trajectory === 'improving') return (
    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      <TrendingUp className="h-3.5 w-3.5" />
      Improving {delta > 0 ? `+${delta} pp` : ''}
    </span>
  )
  if (trajectory === 'declining') return (
    <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
      <TrendingDown className="h-3.5 w-3.5" />
      Declining {delta < 0 ? `${delta} pp` : ''}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
      <Minus className="h-3.5 w-3.5" />
      Steady
    </span>
  )
}

export function NationalExamPredictionCard({
  prediction,
  compact = false,
  showPathway = false,
}: NationalExamPredictionCardProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <Badge variant="outline" className="text-[10px] bg-muted">
          {prediction.exam_level.toUpperCase()} · Predicted: {prediction.predicted_label} {prediction.predicted_grade}
        </Badge>
        <TrajectoryBadge trajectory={prediction.trajectory} delta={prediction.trajectory_delta} />
      </span>
    )
  }

  const confidencePct = Math.round(prediction.confidence * 100)

  return (
    <div className={`rounded-lg border-l-4 border overflow-hidden ${gradeColor(prediction.predicted_grade, prediction.predicted_label)}`}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">
              {prediction.exam_body.toUpperCase()} National Exam · {prediction.subject}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground">
                {prediction.predicted_label} {prediction.predicted_grade}
              </span>
              <span className="text-sm text-muted-foreground">{prediction.predicted_score}%</span>
            </div>
          </div>
        </div>
        <TrajectoryBadge trajectory={prediction.trajectory} delta={prediction.trajectory_delta} />
      </div>

      {/* ── Score range bar ─────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <div className="relative h-2 rounded-full bg-muted">
          <div
            className="absolute h-full rounded-full bg-muted-foreground/40"
            style={{
              left:  `${prediction.predicted_range[0]}%`,
              width: `${prediction.predicted_range[1] - prediction.predicted_range[0]}%`,
            }}
          />
          <div
            className="absolute h-3 w-0.5 bg-foreground/70 -top-0.5 rounded"
            style={{ left: `${prediction.predicted_score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{prediction.predicted_range[0]}%</span>
          <span>Range: {prediction.predicted_range[0]}–{prediction.predicted_range[1]}%</span>
          <span>{prediction.predicted_range[1]}%</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Confidence: {confidencePct}% · Based on {prediction.based_on_submissions} assessment{prediction.based_on_submissions !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Motivational message ─────────────────────────────────────── */}
      {prediction.motivational_message && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              &ldquo;{prediction.motivational_message}&rdquo;
            </p>
          </div>
        </>
      )}

      {/* ── Gap to next grade ─────────────────────────────────────────── */}
      {prediction.gap_to_next_grade > 0 && (
        <>
          <Separator />
          <div className="px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {prediction.gap_to_next_grade} pp needed for{' '}
              <span className="font-medium text-foreground">{prediction.next_grade_label} {prediction.next_grade}</span>
            </p>
          </div>
        </>
      )}

      {/* ── Pathway (highest impact actions) ────────────────────────── */}
      {showPathway && prediction.pathway.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Highest impact actions</p>
            {prediction.pathway.slice(0, 3).map((action) => (
              <div key={action.rank} className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className={`text-[9px] shrink-0 mt-0.5 ${
                    action.urgency === 'high'   ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' :
                    action.urgency === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' :
                    'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  +{action.expected_gain_pp} pp
                </Badge>
                <p className="text-xs text-muted-foreground flex-1">{action.action}</p>
                {action.linked_id && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
