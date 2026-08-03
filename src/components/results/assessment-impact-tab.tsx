'use client'

// src/components/results/assessment-impact-tab.tsx
// Drop-in tab for the assessment results page — shows all reteach impact for this assessment.

import { useEffect, useState, useTransition } from 'react'
import { toast }                              from 'sonner'
import { RefreshCw, Loader2 }                 from 'lucide-react'
import { Button }                             from '@/components/ui/button'
import { Skeleton }                           from '@/components/ui/skeleton'
import { ReteachImpactCard }                  from '@/components/reteach/reteach-impact-card'
import { ReteachImpactSummary }               from '@/components/reteach/reteach-impact-summary'
import { getAssessmentImpact, recalculateSessionImpact } from '@/lib/actions/reteach-impact'
import type { AssessmentImpactView, SessionImpact }      from '@/lib/actions/reteach-impact'

interface AssessmentImpactTabProps {
  assessmentId: string
}

export function AssessmentImpactTab({ assessmentId }: AssessmentImpactTabProps) {
  const [view,    setView]    = useState<AssessmentImpactView | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalcId, setRecalcId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = async () => {
    setLoading(true)
    const { data, error } = await getAssessmentImpact(assessmentId)
    if (error || !data) {
      toast.error(error?.message ?? 'Failed to load impact data.')
    } else {
      setView(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [assessmentId])

  const handleRecalculate = (sessionId: string) => {
    setRecalcId(sessionId)
    startTransition(async () => {
      const { error } = await recalculateSessionImpact(sessionId)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Impact recalculated.')
        await load()
      }
      setRecalcId(null)
    })
  }

  if (loading) return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
    </div>
  )

  if (!view || !view.sessions.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg text-muted-foreground">
      <RefreshCw className="h-8 w-8 mb-3 opacity-25" />
      <p className="text-sm">No intervention sessions for this assessment yet.</p>
      <p className="text-xs mt-1 opacity-75">
        Generate a class or individual session and mark it as delivered to start tracking impact.
      </p>
    </div>
  )

  const completed  = view.sessions.filter(s => s.impact_status === 'completed')
  const awaitingFU = view.sessions.filter(s => s.impact_status === 'awaiting_followup')
  const awaitingDel = view.sessions.filter(s => s.impact_status === 'awaiting_delivery')

  return (
    <div className="space-y-6">

      {/* Header */}
      {view.assessment_title && (
        <p className="text-sm text-muted-foreground">
          Showing intervention impact for <span className="font-medium text-foreground">{view.assessment_title}</span>
        </p>
      )}

      {/* Summary */}
      <ReteachImpactSummary summary={view.summary} />

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Completed · {completed.length}
          </p>
          {completed.map(s => (
            <ReteachImpactCard key={s.session_id} impact={s} showName />
          ))}
        </div>
      )}

      {/* Awaiting follow-up */}
      {awaitingFU.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Awaiting follow-up · {awaitingFU.length}
          </p>
          {awaitingFU.map(s => (
            <div key={s.session_id} className="space-y-1">
              <ReteachImpactCard impact={s} showName />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground gap-1.5"
                disabled={recalcId === s.session_id}
                onClick={() => handleRecalculate(s.session_id)}
              >
                {recalcId === s.session_id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <RefreshCw className="h-3 w-3" />
                }
                Recalculate impact
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Not yet delivered */}
      {awaitingDel.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Not yet delivered · {awaitingDel.length}
          </p>
          {awaitingDel.map(s => (
            <ReteachImpactCard key={s.session_id} impact={s} showName />
          ))}
        </div>
      )}
    </div>
  )
}