'use client'

// src/components/students/student-impact-tab.tsx
// Drop-in tab for the student profile — shows all reteach impact for this student.

import { useEffect, useState, useTransition } from 'react'
import { toast }                              from 'sonner'
import { RefreshCw, Loader2 }                 from 'lucide-react'
import { Button }                             from '@/components/ui/button'
import { Skeleton }                           from '@/components/ui/skeleton'
import { ReteachImpactCard }                  from '@/components/reteach/reteach-impact-card'
import { ReteachImpactSummary }               from '@/components/reteach/reteach-impact-summary'
import { recalculateSessionImpact, getStudentImpact } from '@/lib/actions/reteach-impact'
import type { StudentImpactView, SessionImpact } from '@/lib/actions/reteach-impact'

interface StudentImpactTabProps {
  studentId: string
}

export function StudentImpactTab({ studentId }: StudentImpactTabProps) {
  const [view,    setView]    = useState<StudentImpactView | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalcId, setRecalcId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = async () => {
    setLoading(true)
    const { data, error } = await getStudentImpact(studentId)
    if (error || !data) {
      toast.error(error?.message ?? 'Failed to load impact data.')
    } else {
      setView(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [studentId])

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
      <p className="text-sm">No intervention sessions yet.</p>
      <p className="text-xs mt-1 opacity-75">
        Generate a session and mark it as delivered to start tracking impact.
      </p>
    </div>
  )

  const completed   = view.sessions.filter(s => s.impact_status === 'completed')
  const awaitingFU  = view.sessions.filter(s => s.impact_status === 'awaiting_followup')
  const awaitingDel = view.sessions.filter(s => s.impact_status === 'awaiting_delivery')

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <ReteachImpactSummary summary={view.summary} />

      {/* Completed sessions */}
      {completed.length > 0 && (
        <Section
          title="Completed"
          count={completed.length}
          sessions={completed}
          recalcId={recalcId}
          onRecalculate={handleRecalculate}
        />
      )}

      {/* Awaiting follow-up */}
      {awaitingFU.length > 0 && (
        <Section
          title="Awaiting follow-up assessment"
          count={awaitingFU.length}
          sessions={awaitingFU}
          recalcId={recalcId}
          onRecalculate={handleRecalculate}
        />
      )}

      {/* Not yet delivered */}
      {awaitingDel.length > 0 && (
        <Section
          title="Not yet delivered"
          count={awaitingDel.length}
          sessions={awaitingDel}
          recalcId={recalcId}
          onRecalculate={handleRecalculate}
        />
      )}
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────

function Section({ title, count, sessions, recalcId, onRecalculate }: {
  title:         string
  count:         number
  sessions:      SessionImpact[]
  recalcId:      string | null
  onRecalculate: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {title} · {count}
      </p>
      {sessions.map(s => (
        <div key={s.session_id} className="space-y-1">
          <ReteachImpactCard impact={s} showName={false} />
          {/* Recalculate button for awaiting-followup sessions that have a follow-up assessment */}
          {s.impact_status === 'awaiting_followup' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 gap-1.5"
              disabled={recalcId === s.session_id}
              onClick={() => onRecalculate(s.session_id)}
            >
              {recalcId === s.session_id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <RefreshCw className="h-3 w-3" />
              }
              Recalculate impact
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}