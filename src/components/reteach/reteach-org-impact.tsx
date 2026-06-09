'use client'

// src/components/reteach/reteach-org-impact.tsx
// Org-wide impact summary — sits on the main dashboard or a dedicated reteach page.

import { useEffect, useState }  from 'react'
import { toast }                from 'sonner'
import { TrendingUp, TrendingDown, Minus, BarChart3, Zap, Users, Brain } from 'lucide-react'
import { Skeleton }             from '@/components/ui/skeleton'
import { Separator }            from '@/components/ui/separator'
import { Badge }                from '@/components/ui/badge'
import { ReteachImpactCard }    from '@/components/reteach/reteach-impact-card'
import { getOrgImpact }         from '@/lib/actions/reteach-impact'
import type { OrgImpactView }   from '@/lib/actions/reteach-impact'

export function ReteachOrgImpact() {
  const [view,    setView]    = useState<OrgImpactView | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrgImpact().then(({ data, error }) => {
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to load org impact.')
      } else {
        setView(data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )

  if (!view) return null

  const avgDelta  = view.impact.avg_improvement_delta
  const direction = view.impact.direction

  const DeltaIcon =
    direction === 'improved'  ? TrendingUp  :
    direction === 'regressed' ? TrendingDown :
    Minus

  const deltaColor =
    direction === 'improved'  ? 'text-green-600' :
    direction === 'regressed' ? 'text-red-600'   :
    'text-muted-foreground'

  return (
    <div className="space-y-6">

      {/* ── Totals row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total sessions"  value={String(view.totals.total)} />
        <StatCard label="Delivered"       value={String(view.totals.delivered)} />
        <StatCard label="Completed"       value={String(view.totals.completed)} />
        <StatCard
          label="Completion rate"
          value={`${view.totals.completion_rate}%`}
          sub={`${view.totals.completed} of ${view.totals.total}`}
        />
      </div>

      {/* ── Avg impact ───────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Overall intervention impact
        </p>
        <div className={`flex items-center gap-2 ${deltaColor}`}>
          <DeltaIcon className="h-6 w-6" />
          <span className="text-3xl font-bold">
            {avgDelta !== null
              ? `${avgDelta > 0 ? '+' : ''}${avgDelta}%`
              : '—'
            }
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            avg score improvement across {view.impact.sessions_with_data} completed session(s)
          </span>
        </div>
      </div>

      {/* ── Scope breakdown ──────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sessions by type
        </p>
        <div className="flex flex-wrap gap-3">
          <ScopeChip Icon={Zap}   label="Individual"  count={view.scope_breakdown.individual}   color="amber"  />
          <ScopeChip Icon={Users} label="Whole class" count={view.scope_breakdown.class}         color="blue"   />
          <ScopeChip Icon={Brain} label="Coaching"    count={view.scope_breakdown.longitudinal}  color="purple" />
        </div>
      </div>

      {/* ── Error breakdown ──────────────────────────────────────────── */}
      {view.error_breakdown.length > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Impact by error type
            </p>
          </div>
          <div className="space-y-2">
            {view.error_breakdown.map((e) => {
              const isPositive = e.direction === 'improved'
              const isNegative = e.direction === 'regressed'
              return (
                <div key={e.error_type} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-foreground truncate">{e.error_type}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {e.session_count} session{e.session_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${
                    isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {e.avg_delta > 0 ? '+' : ''}{e.avg_delta}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent completed ─────────────────────────────────────────── */}
      {view.recent_completed.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recently completed
          </p>
          {view.recent_completed.map(s => (
            <ReteachImpactCard key={s.session_id} impact={s} showName />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ScopeChip({ Icon, label, count, color }: {
  Icon:  React.ElementType
  label: string
  count: number
  color: 'amber' | 'blue' | 'purple'
}) {
  const styles = {
    amber:  'bg-amber-500/10  text-amber-600  border-amber-500/20',
    blue:   'bg-blue-500/10   text-blue-600   border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  }
  return (
    <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-sm ${styles[color]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className="font-bold ml-1">{count}</span>
    </Badge>
  )
}
