'use client'

// src/components/reteach/reteach-impact-card.tsx
// M2: Precision upgrade — full before/after, error reduction, time to impact, confidence

import { format }        from 'date-fns'
import {
  TrendingUp, TrendingDown, Minus, Clock,
  CheckCircle2, AlertCircle, Zap, Users, Brain, Shield,
} from 'lucide-react'
import { Badge }         from '@/components/ui/badge'
import { Separator }     from '@/components/ui/separator'
import type { SessionImpact } from '@/lib/actions/reteach-impact'

// ── Helpers ────────────────────────────────────────────────────────────────

const SCOPE_META = {
  individual:   { Icon: Zap,   label: 'Individual',  bg: 'bg-amber-50',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200'  },
  class:        { Icon: Users, label: 'Whole class', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  longitudinal: { Icon: Brain, label: 'Coaching',    bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  group:        { Icon: Users, label: 'Group',       bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
}

function DeltaBadge({ improvement }: { improvement: SessionImpact['improvement'] }) {
  if (improvement.direction === 'pending') return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Pending
    </span>
  )
  if (improvement.direction === 'improved') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
      <TrendingUp className="h-3.5 w-3.5" />
      {improvement.label}
    </span>
  )
  if (improvement.direction === 'regressed') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
      <TrendingDown className="h-3.5 w-3.5" />
      {improvement.label}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      No change
    </span>
  )
}

function ImpactStatusPill({ status }: { status: SessionImpact['impact_status'] }) {
  if (status === 'awaiting_delivery') return (
    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
      Not yet delivered
    </Badge>
  )
  if (status === 'awaiting_followup') return (
    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
      Awaiting follow-up
    </Badge>
  )
  return (
    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Completed
    </Badge>
  )
}

// ── Score bar ──────────────────────────────────────────────────────────────

function ScoreBar({ before, after }: { before: number | null; after: number | null }) {
  if (before === null) return (
    <p className="text-xs text-muted-foreground italic">No baseline captured yet</p>
  )
  const delta = after !== null ? after - before : null
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-14 shrink-0">Before</span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${before}%` }} />
        </div>
        <span className="text-xs font-medium text-foreground w-10 text-right">{before}%</span>
      </div>
      {after !== null ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">After</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${after >= before ? 'bg-green-500' : 'bg-red-400'}`}
              style={{ width: `${after}%` }}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-10 text-right">{after}%</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 shrink-0">After</span>
          <div className="flex-1 h-2 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground w-10 text-right">—</span>
        </div>
      )}
      {delta !== null && (
        <p className={`text-xs font-medium ${delta > 0 ? 'text-green-700' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
          {delta > 0 ? '+' : ''}{delta} pp improvement
        </p>
      )}
    </div>
  )
}

// ── Main card ──────────────────────────────────────────────────────────────

interface ReteachImpactCardProps {
  impact:     SessionImpact
  showName?:  boolean
}

export function ReteachImpactCard({ impact, showName = true }: ReteachImpactCardProps) {
  const scope     = SCOPE_META[impact.scope] ?? SCOPE_META['class']
  const ScopeIcon = scope.Icon

  return (
    <div className="rounded-lg border bg-white space-y-0 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${scope.bg}`}>
            <ScopeIcon className={`h-4 w-4 ${scope.text}`} />
          </div>
          <div className="min-w-0">
            {showName && (impact.student_name || impact.assessment_title || impact.class_name) && (
              <p className="text-xs text-muted-foreground mb-0.5">
                {impact.student_name ?? impact.class_name ?? impact.assessment_title}
              </p>
            )}
            <p className="text-sm font-medium text-foreground truncate">
              {impact.error_type}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(impact.generated_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ImpactStatusPill status={impact.impact_status} />
          <DeltaBadge improvement={impact.improvement} />
        </div>
      </div>

      <Separator />

      {/* ── Score outcome ───────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Score Outcome</p>
        <ScoreBar before={impact.baseline.score} after={impact.result.score} />
        {impact.benchmark_label && (
          <p className={`text-xs mt-1 ${
            impact.benchmark_label === 'Above class average' ? 'text-green-600' :
            impact.benchmark_label === 'Below class average' ? 'text-red-500' :
            'text-muted-foreground'
          }`}>
            {impact.benchmark_label}
            {impact.pp_above_class_avg !== null && impact.pp_above_class_avg !== 0 && (
              <span className="ml-1">
                ({impact.pp_above_class_avg > 0 ? '+' : ''}{impact.pp_above_class_avg} pp vs class avg)
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── Error rate change ────────────────────────────────────────── */}
      {impact.error_rate_change && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Error Rate — {impact.error_type}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">{impact.error_rate_change.before}%</span>
              <span className="text-muted-foreground">→</span>
              <span className={
                impact.error_rate_change.direction === 'reduced'   ? 'text-green-700 font-medium' :
                impact.error_rate_change.direction === 'increased' ? 'text-red-600 font-medium'   :
                'text-muted-foreground'
              }>
                {impact.error_rate_change.after}%
              </span>
              <span className={`ml-1 ${
                impact.error_rate_change.direction === 'reduced'   ? 'text-green-600' :
                impact.error_rate_change.direction === 'increased' ? 'text-red-500'   :
                'text-muted-foreground'
              }`}>
                ({impact.error_rate_change.delta > 0 ? '+' : ''}{impact.error_rate_change.delta} pp)
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Exit ticket leading indicator ────────────────────────────── */}
      {impact.quick_score_pct !== null && impact.impact_status !== 'completed' && (
        <>
          <Separator />
          <div className="px-4 py-3 bg-amber-50/40">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
              Exit Ticket (in-session)
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">{impact.quick_score_pct}%</span> demonstrated understanding immediately after session
            </p>
            {impact.quick_score_at && (
              <p className="text-xs text-amber-600 mt-0.5">
                Logged: {format(new Date(impact.quick_score_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Timeline + confidence ────────────────────────────────────── */}
      {(impact.delivered_at || impact.follow_up_date || impact.completed_at) && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {impact.delivered_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  Delivered {format(new Date(impact.delivered_at), 'MMM d')}
                </div>
              )}
              {impact.follow_up_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                  Follow-up {format(new Date(impact.follow_up_date), 'MMM d')}
                </div>
              )}
              {impact.completed_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                  Completed {format(new Date(impact.completed_at), 'MMM d')}
                </div>
              )}
            </div>
            {impact.time_to_impact_days !== null && (
              <p className="text-xs text-muted-foreground">
                Time to impact: {impact.time_to_impact_days} day{impact.time_to_impact_days !== 1 ? 's' : ''}
              </p>
            )}
            {impact.confidence_level && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-blue-400 shrink-0" />
                Confidence: {impact.confidence_level}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Awaiting followup nudge ───────────────────────────────────── */}
      {impact.impact_status === 'awaiting_followup' && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 dark:text-amber-300">{impact.result.label}</p>
        </div>
      )}
    </div>
  )
}
