// src/components/reteach/intervention-suggestion-banner.tsx
// C1/C2: Shows intervention suggestions on the assessment results page.
// Server component — fetches suggestions and renders a banner when errors affect ≥30% of students.

import Link from 'next/link'
import { getReteachSuggestions } from '@/lib/actions/reteach-suggestions'
import { Button } from '@/components/ui/button'
import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface InterventionSuggestionBannerProps {
  assessmentId: string
}

export async function InterventionSuggestionBanner({ assessmentId }: InterventionSuggestionBannerProps) {
  const { data: suggestions } = await getReteachSuggestions(assessmentId)

  if (!suggestions?.length) return null

  // Only show the banner if at least one error affects ≥30% of students
  const highPriority = suggestions.filter(s => s.pct >= 30 && !s.session_exists)
  if (!highPriority.length) return null

  const topSuggestion = highPriority[0]

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-rose-800">
            Intervention recommended
          </p>
          <p className="text-sm text-rose-700 mt-0.5">
            <span className="font-medium">{topSuggestion.pct}%</span> of students ({topSuggestion.affected_count} of {topSuggestion.total_count}) showed{' '}
            <span className="font-medium">{topSuggestion.error_type}</span>.
            {highPriority.length > 1 && ` ${highPriority.length - 1} other error${highPriority.length > 2 ? 's' : ''} also need attention.`}
          </p>
        </div>
        <Button size="sm" className="gap-2 shrink-0" asChild>
          <Link href={`/dashboard/assessments/${assessmentId}/reteach?errorType=${encodeURIComponent(topSuggestion.error_type)}`}>
            <Zap className="h-3.5 w-3.5" />
            Generate class session
          </Link>
        </Button>
      </div>

      {highPriority.length > 1 && (
        <div className="space-y-1 pl-8">
          {highPriority.slice(1, 3).map((s) => (
            <div key={s.error_type} className="flex items-center gap-2 text-xs text-rose-700">
              {s.session_exists
                ? <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                : <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
              }
              <span>{s.error_type}</span>
              <span className="text-rose-500">— {s.pct}% of students</span>
              {s.session_exists && <span className="text-emerald-600">(session exists)</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
