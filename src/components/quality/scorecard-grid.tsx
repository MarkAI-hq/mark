// src/components/quality/scorecard-grid.tsx
// Shared presentational pieces for rendering OrgQualityScorecard[] — used by
// both the Admin dashboard's org-wide view (tutoring-quality-section.tsx,
// self-fetching client component) and the Guardian child-overview page
// (server-fetched, one child's own subjects). No hooks here, so this file
// works from either a client or a server component.

import { Badge } from '@/components/ui/badge'
import type { OrgQualityScorecard } from '@/lib/actions/quality-eval'

// Same 75/40 bands as the Root/Support raw view (tutoring-quality-client.tsx)
// — keeping the thresholds identical across every surface so the same
// number reads as the same color everywhere in the platform, rather than
// reusing school-analytics-section.tsx's performanceBadge bands (80/60/50),
// which are calibrated for student assessment scores, a different metric.
export function qualityBadge(rate: number | null) {
  if (rate === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs">
        No data yet
      </Badge>
    )
  }
  if (rate >= 75) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 text-xs">
        Strong
      </Badge>
    )
  }
  if (rate >= 40) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 text-xs">
        Needs attention
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 text-xs">
      At risk
    </Badge>
  )
}

export function rateTextColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground'
  if (rate >= 75) return 'text-emerald-600 dark:text-emerald-400'
  if (rate >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function rateBarColor(rate: number | null): string {
  if (rate === null) return '#cbd5e1'
  if (rate >= 75) return '#34d399'
  if (rate >= 40) return '#fbbf24'
  return '#ef4444'
}

const DIMENSIONS = [
  { key: 'misconception_diagnosis_rate' as const, label: 'Diagnoses the misconception' },
  { key: 'withholding_narrow_rate' as const, label: 'Never states the answer' },
  { key: 'withholding_strict_rate' as const, label: 'Strict Socratic restraint' },
  { key: 'factual_accuracy_rate' as const, label: 'Factually accurate' },
  { key: 'correctness_validation_rate' as const, label: 'Validates correct work' },
]

export function computeAverageCleanPass(scorecards: OrgQualityScorecard[]): number | null {
  const sampled = scorecards.filter((s) => s.total_conversations > 0)
  if (sampled.length === 0) return null
  return Math.round(sampled.reduce((sum, s) => sum + (s.clean_pass_rate ?? 0), 0) / sampled.length)
}

export function ScorecardCard({ sc }: { sc: OrgQualityScorecard }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{sc.subject}</p>
          <p className="text-xs text-muted-foreground">
            {sc.total_conversations} tutoring conversation{sc.total_conversations !== 1 ? 's' : ''} sampled
          </p>
        </div>
        {qualityBadge(sc.clean_pass_rate)}
      </div>

      {sc.total_conversations === 0 ? (
        <p className="text-xs text-muted-foreground">
          No tutoring conversations have been evaluated for this subject yet.
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${rateTextColor(sc.clean_pass_rate)}`}>
              {sc.clean_pass_rate === null ? '—' : `${sc.clean_pass_rate}%`}
            </span>
            <span className="text-xs text-muted-foreground">clean pass rate</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {DIMENSIONS.map((d) => {
              const rate = sc[d.key]
              return (
                <div key={d.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground truncate">{d.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${rate ?? 0}%`, backgroundColor: rateBarColor(rate) }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-9 text-right ${rateTextColor(rate)}`}>
                      {rate === null ? '—' : `${rate}%`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function QualityScorecardGrid({ scorecards }: { scorecards: OrgQualityScorecard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scorecards.map((sc) => <ScorecardCard key={sc.curriculum_id} sc={sc} />)}
    </div>
  )
}
