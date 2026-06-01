'use client'

// src/components/reteach/reteach-impact-summary.tsx
// Summary bar — totals + avg delta. Used at the top of student/assessment impact views.

import { TrendingUp, TrendingDown, Minus, Clock, CheckCircle2 } from 'lucide-react'
import type { ImpactSummary } from '@/lib/actions/reteach-impact'

interface ReteachImpactSummaryProps {
  summary: ImpactSummary
}

export function ReteachImpactSummary({ summary }: ReteachImpactSummaryProps) {
  const deltaColor =
    summary.overall_direction === 'improved'  ? 'text-green-700' :
    summary.overall_direction === 'regressed' ? 'text-red-600'   :
    'text-slate-500'

  const DeltaIcon =
    summary.overall_direction === 'improved'  ? TrendingUp   :
    summary.overall_direction === 'regressed' ? TrendingDown  :
    Minus

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

      {/* Total */}
      <div className="rounded-lg border bg-white p-3 space-y-1">
        <p className="text-xs text-slate-500">Total sessions</p>
        <p className="text-2xl font-semibold text-slate-900">{summary.total}</p>
      </div>

      {/* Completed */}
      <div className="rounded-lg border bg-white p-3 space-y-1">
        <p className="text-xs text-slate-500">Completed</p>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-2xl font-semibold text-slate-900">{summary.completed}</p>
        </div>
      </div>

      {/* Awaiting follow-up */}
      <div className="rounded-lg border bg-white p-3 space-y-1">
        <p className="text-xs text-slate-500">Awaiting follow-up</p>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-2xl font-semibold text-slate-900">{summary.awaiting_followup}</p>
        </div>
      </div>

      {/* Avg delta */}
      <div className="rounded-lg border bg-white p-3 space-y-1">
        <p className="text-xs text-slate-500">Avg improvement</p>
        <div className={`flex items-center gap-1.5 ${deltaColor}`}>
          <DeltaIcon className="h-4 w-4 shrink-0" />
          <p className="text-2xl font-semibold tabular-nums">
            {summary.avg_improvement_delta !== null
              ? `${summary.avg_improvement_delta > 0 ? '+' : ''}${summary.avg_improvement_delta} pp`
              : '—'
            }
          </p>
        </div>
      </div>
    </div>
  )
}