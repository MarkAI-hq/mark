'use client'

// src/components/reteach/reteach-history-list.tsx

import { useState }              from 'react'
import { format }                from 'date-fns'
import {
  CheckCircle2, Clock, ChevronDown, ChevronUp,
  Zap, Users, Brain, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { Badge }                 from '@/components/ui/badge'
import { Button }                from '@/components/ui/button'
import { Separator }             from '@/components/ui/separator'
import { ReteachSessionContent } from '@/components/reteach/reteach-session-content'
import { ReteachDeliverModal }   from '@/components/reteach/reteach-deliver-modal'
import type { ReteachSessionRecord } from '@/lib/actions/reteach-history'

// ── Scope meta ─────────────────────────────────────────────────────────────

const SCOPE_META = {
  individual:   { Icon: Zap,   label: 'Individual',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  class:        { Icon: Users, label: 'Whole class', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  longitudinal: { Icon: Brain, label: 'Coaching',    bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

const STATUS_META = {
  generated: { label: 'Not yet delivered', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  delivered: { label: 'Delivered',         bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'   },
  completed: { label: 'Completed',         bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

// ── Impact badge ───────────────────────────────────────────────────────────

function ImpactBadge({ delta }: { delta: number }) {
  if (delta > 0) return (
    <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
      <TrendingUp className="h-3.5 w-3.5" />+{delta}% improvement
    </div>
  )
  if (delta < 0) return (
    <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
      <TrendingDown className="h-3.5 w-3.5" />{delta}% regression
    </div>
  )
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
      <Minus className="h-3.5 w-3.5" />No change
    </div>
  )
}

// ── Single history row ─────────────────────────────────────────────────────

function ReteachHistoryRow({
  record,
  onDelivered,
  classId,
}: {
  record:      ReteachSessionRecord
  onDelivered: (updated: ReteachSessionRecord) => void
  classId?:    string
}) {
  const [expanded,    setExpanded]    = useState(false)
  const [deliverOpen, setDeliverOpen] = useState(false)

  const scope     = SCOPE_META[record.scope]
  const status    = STATUS_META[record.status]
  const ScopeIcon = scope.Icon
  const isPending = record.status === 'generated'

  return (
    <>
      <div className="rounded-lg border bg-card">

        {/* ── Row header ── */}
        <div
          className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${scope.bg}`}>
              <ScopeIcon className={`h-4 w-4 ${scope.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {record.session_data?.title ?? 'Reteach Session'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(record.createdAt), 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {record.improvement_delta != null && (
              <ImpactBadge delta={record.improvement_delta} />
            )}
            <Badge variant="outline" className={`text-xs ${scope.bg} ${scope.text} ${scope.border}`}>
              {scope.label}
            </Badge>
            <Badge variant="outline" className={`text-xs ${status.bg} ${status.text} ${status.border}`}>
              {status.label}
            </Badge>

            {/* Inline deliver button — visible on the row for pending sessions */}
            {/* Teacher sees the action without needing to expand first        */}
            {isPending && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                onClick={(e) => { e.stopPropagation(); setDeliverOpen(true) }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mark delivered
              </Button>
            )}

            {expanded
              ? <ChevronUp   className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </div>

        {/* ── Expanded content ── */}
        {expanded && (
          <div className="border-t">

            {/* Pending reminder inside expansion too */}
            {isPending && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Have you run this session with your students?
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 shrink-0"
                  onClick={(e) => { e.stopPropagation(); setDeliverOpen(true) }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark as delivered
                </Button>
              </div>
            )}

            {/* Delivered info bar */}
            {!isPending && (
              <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-100 dark:border-green-900/50 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Delivered {record.delivered_at
                      ? format(new Date(record.delivered_at), 'MMM d, yyyy')
                      : ''}
                  </p>
                </div>
                {record.score_before != null && (
                  <p className="text-xs text-muted-foreground">
                    Score at delivery: <span className="font-medium">{record.score_before}%</span>
                  </p>
                )}
                {record.error_rate_before != null && (
                  <p className="text-xs text-muted-foreground">
                    Error rate at delivery: <span className="font-medium">{record.error_rate_before}%</span>
                  </p>
                )}
                {record.follow_up_date && (
                  <p className="text-xs text-muted-foreground">
                    Follow-up: <span className="font-medium">
                      {format(new Date(record.follow_up_date), 'MMM d, yyyy')}
                    </span>
                  </p>
                )}
                {record.improvement_delta != null && (
                  <ImpactBadge delta={record.improvement_delta} />
                )}
              </div>
            )}

            <div className="p-4">
              {record.session_data
                ? <ReteachSessionContent session={record.session_data} />
                : <p className="text-sm text-muted-foreground">Session content unavailable.</p>
              }
            </div>
          </div>
        )}
      </div>

      <ReteachDeliverModal
        open={deliverOpen}
        onOpenChange={setDeliverOpen}
        sessionId={record.id}
        scope={record.scope}
        errorType={record.error_type}
        classId={classId}
        onDelivered={(updated) => onDelivered(updated)}
      />
    </>
  )
}

// ── Main list ──────────────────────────────────────────────────────────────

interface ReteachHistoryListProps {
  records:     ReteachSessionRecord[]
  emptyLabel?: string
  classId?:    string
}

export function ReteachHistoryList({
  records:    initialRecords,
  emptyLabel = 'No intervention sessions yet.',
  classId,
}: ReteachHistoryListProps) {
  const [records, setRecords] = useState(initialRecords)

  const handleDelivered = (updated: ReteachSessionRecord) => {
    setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r))
  }

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
        <Zap className="h-8 w-8 mb-3 opacity-25" />
        <p className="text-sm">{emptyLabel}</p>
        <p className="text-xs mt-1 opacity-75">
          Generate an intervention session to see it here.
        </p>
      </div>
    )
  }

  const pending   = records.filter((r) => r.status === 'generated')
  const delivered = records.filter((r) => r.status !== 'generated')

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Not yet delivered · {pending.length}
          </p>
          {pending.map((r) => (
            <ReteachHistoryRow
              key={r.id}
              record={r}
              classId={classId}
              onDelivered={handleDelivered}
            />
          ))}
        </div>
      )}

      {delivered.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && <Separator />}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Delivered · {delivered.length}
          </p>
          {delivered.map((r) => (
            <ReteachHistoryRow
              key={r.id}
              record={r}
              classId={classId}
              onDelivered={handleDelivered}
            />
          ))}
        </div>
      )}
    </div>
  )
}