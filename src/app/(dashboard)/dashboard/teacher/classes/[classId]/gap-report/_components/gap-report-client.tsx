'use client'

import { useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { GitBranch, AlertCircle, Users, BookOpen, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ExposureMatrix } from '@/lib/actions/gap-attribution'
import { dispatchStudyPlans } from '@/lib/actions/study-plans'

type ExposureStatus = 'present' | 'absent' | 'partial' | 'no_session' | 'no_record'

const STATUS_CONFIG: Record<ExposureStatus, { label: string; cell: string; dot: string }> = {
  present:    { label: 'Present',      cell: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',  dot: 'bg-emerald-500' },
  absent:     { label: 'Absent',       cell: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',                 dot: 'bg-red-500' },
  partial:    { label: 'Partial',      cell: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',         dot: 'bg-amber-500' },
  no_session: { label: 'Not recorded', cell: 'bg-muted/60 text-muted-foreground',                                           dot: 'bg-muted-foreground' },
  no_record:  { label: 'No record',    cell: 'bg-slate-100 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400',        dot: 'bg-slate-400' },
}

function ExposureCell({ status, studentName, topic }: {
  status: ExposureStatus; studentName: string; topic: string
}) {
  const cfg = STATUS_CONFIG[status]
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-default ${cfg.cell}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{studentName}</p>
          <p>{topic}</p>
          <p className="text-muted-foreground">{cfg.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface Props {
  classId: string
  matrix: ExposureMatrix | null
  error: string | null
}

export function GapReportClient({ classId, matrix, error }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [isPending, startT] = useTransition()

  function handleDispatch() {
    startT(async () => {
      const res = await dispatchStudyPlans(classId)
      if (res.error) { toast.error(res.error.message); return }
      toast.success('Study plans queued — students will receive personalised lessons based on this gap report.')
    })
  }

  if (error || !matrix) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error ?? 'No exposure matrix available.'}</p>
        </div>
        {!matrix?.sow_id && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
                <BookOpen className="h-8 w-8 text-gold/60" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">No active Scheme of Work</p>
                <p className="text-xs text-muted-foreground max-w-xs">Assign and activate a SoW for this class to see the exposure matrix.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (matrix.rows.length === 0 || matrix.students.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
              <GitBranch className="h-8 w-8 text-gold/60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Matrix is empty</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {matrix.students.length === 0
                  ? 'No enrolled students found.'
                  : 'No SoW entries found. Add entries to the Scheme of Work first.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Compute per-row stats
  const rowStats = matrix.rows.map((row) => {
    const vals = Object.values(row.student_exposure)
    const present  = vals.filter((v) => v === 'present').length
    const absent   = vals.filter((v) => v === 'absent').length
    const partial  = vals.filter((v) => v === 'partial').length
    const recorded = present + absent + partial
    const rate = recorded > 0 ? Math.round((present / recorded) * 100) : null
    return { ...row, present, absent, partial, recorded, rate }
  })

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Exposure Matrix</h2>
          <p className="text-sm text-muted-foreground">
            {matrix.rows.length} topics × {matrix.students.length} students — who was present when each topic was taught
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            {(Object.keys(STATUS_CONFIG) as ExposureStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                {STATUS_CONFIG[s].label}
              </span>
            ))}
          </div>
          {/* Dispatch button */}
          <Button
            size="sm"
            variant="gold"
            onClick={handleDispatch}
            disabled={isPending}
            className="gap-2 shrink-0"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'Queuing...' : 'Dispatch Study Plans'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Topics tracked', value: matrix.rows.length, icon: BookOpen },
          { label: 'Students',       value: matrix.students.length, icon: Users },
          {
            label: 'Topics with absences',
            value: rowStats.filter((r) => r.absent > 0 || r.partial > 0).length,
            icon: AlertCircle,
          },
          {
            label: 'Avg exposure rate',
            value: (() => {
              const rated = rowStats.filter((r) => r.rate !== null)
              if (rated.length === 0) return '—'
              return `${Math.round(rated.reduce((s, r) => s + r.rate!, 0) / rated.length)}%`
            })(),
            icon: GitBranch,
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-5">
              <div className="space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Matrix grid — scrollable horizontally */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-surface-raised/95">
              <th className="sticky left-0 bg-surface-raised/95 backdrop-blur-sm px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-48 min-w-[192px]">
                Topic (Week)
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-20">
                Rate
              </th>
              {matrix.students.map((s) => (
                <th key={s.student_id} className="px-1.5 py-2.5 text-center">
                  <span className="text-xs font-medium text-muted-foreground block max-w-[60px] truncate mx-auto">
                    {s.name.split(' ')[0]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rowStats.map((row) => (
              <tr
                key={row.sow_entry_id}
                className={`transition-colors ${hoveredRow === row.sow_entry_id ? 'bg-muted/20' : 'hover:bg-muted/10'}`}
                onMouseEnter={() => setHoveredRow(row.sow_entry_id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Topic + week */}
                <td className="sticky left-0 bg-background px-4 py-2.5 min-w-[192px]">
                  <p className="text-xs font-medium truncate max-w-[170px]">{row.topic}</p>
                  <p className="text-xs text-muted-foreground">Wk {row.week_number}
                    {row.lesson_dates[0] ? ` · ${format(parseISO(row.lesson_dates[0]), 'd MMM')}` : ''}
                  </p>
                </td>

                {/* Rate */}
                <td className="px-3 py-2.5">
                  {row.rate !== null ? (
                    <Badge className={`text-xs ${
                      row.rate >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      row.rate >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                    }`}>
                      {row.rate}%
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Per-student cells */}
                {matrix.students.map((s) => {
                  const status = (row.student_exposure[s.student_id] ?? 'no_session') as ExposureStatus
                  return (
                    <td key={s.student_id} className="px-1.5 py-2">
                      <div className="flex justify-center">
                        <ExposureCell status={status} studentName={s.name} topic={row.topic} />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Hover over any cell for details. &quot;Not recorded&quot; means the lesson occurred but attendance was not taken for that date.
      </p>
    </div>
  )
}
