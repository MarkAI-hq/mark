'use client'

// src/components/dashboard/tutoring-quality-section.tsx
// Admin-facing tutoring-quality scorecard — one card per curriculum the
// school actually teaches. Self-fetching, mirrors reteach-org-impact.tsx's
// pattern (loading skeleton -> empty state -> content) so it sits on the
// main dashboard as another peer section rather than a bolted-on widget.

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricEmptyState } from '@/components/ui/metric-empty-state'
import { QualityScorecardGrid, computeAverageCleanPass, rateTextColor } from '@/components/quality/scorecard-grid'
import { getOrgQualityScorecards } from '@/lib/actions/quality-eval'
import type { OrgQualityScorecard } from '@/lib/actions/quality-eval'

export function TutoringQualitySection() {
  const [scorecards, setScorecards] = useState<OrgQualityScorecard[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrgQualityScorecards().then(({ data, error }) => {
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to load tutoring quality data.')
      } else {
        setScorecards(data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
    </div>
  )

  if (!scorecards) return (
    <MetricEmptyState
      label="Couldn't load tutoring quality"
      reason="The API didn't return data for this section — try refreshing. If it persists, check API connectivity."
    />
  )

  if (scorecards.length === 0) return (
    <MetricEmptyState
      label="No curriculum assigned yet"
      reason="Assign a scheme of work to a class to see how well Tracy teaches that subject."
    />
  )

  const avgCleanPass = computeAverageCleanPass(scorecards)
  const HeadlineIcon =
    avgCleanPass === null ? ShieldQuestion : avgCleanPass >= 75 ? ShieldCheck : ShieldAlert

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <HeadlineIcon className={`h-8 w-8 shrink-0 ${rateTextColor(avgCleanPass)}`} />
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tutoring quality, averaged across sampled subjects
          </p>
          <p className={`text-2xl font-bold ${rateTextColor(avgCleanPass)}`}>
            {avgCleanPass === null ? 'Not sampled yet' : `${avgCleanPass}%`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simulated students, real misconceptions, judged independently — not self-reported.
          </p>
        </div>
      </div>

      <QualityScorecardGrid scorecards={scorecards} />
    </div>
  )
}
