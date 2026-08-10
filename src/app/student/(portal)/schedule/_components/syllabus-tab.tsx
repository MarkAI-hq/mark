'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, Circle,
  TrendingUp, BookOpen, ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { toast } from 'sonner'
import {
  type PacingResponse,
  type PacingScheme,
  type PacingEntry,
  initiateFreeStudyPlan,
} from '@/lib/actions/student-dashboard'
import { formatTopicTitle } from '@/lib/utils'

const BLOOM_LABELS: Record<string, string> = {
  knowledge:     'Memory',
  remember:      'Memory',
  comprehension: 'Understand',
  understand:    'Understand',
  application:   'Apply',
  apply:         'Apply',
  analysis:      'Analyse',
  analyse:       'Analyse',
  synthesis:     'Synthesise',
  evaluation:    'Evaluate',
  evaluate:      'Evaluate',
}

function normaliseBloom(raw: Record<string, number>): Array<{ label: string; value: number }> {
  const seen = new Set<string>()
  return Object.entries(raw)
    .map(([k, v]) => ({ label: BLOOM_LABELS[k.toLowerCase()] ?? k, value: v }))
    .filter(({ label }) => {
      if (seen.has(label)) return false
      seen.add(label)
      return true
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

// ── Entry status ──────────────────────────────────────────────────────────────

function entryStatus(entry: PacingEntry) {
  if (entry.status === 'strong') {
    return { Icon: CheckCircle2, iconClass: 'text-emerald-500', ctaLabel: null as string | null }
  }
  if (entry.status === 'developing') {
    return { Icon: Clock, iconClass: 'text-amber-500', ctaLabel: entry.is_behind ? 'Review' : null }
  }
  if (entry.is_behind && entry.plan_count === 0) {
    return { Icon: XCircle, iconClass: 'text-rose-400', ctaLabel: 'Start' }
  }
  if (entry.is_behind) {
    return { Icon: AlertTriangle, iconClass: 'text-rose-500', ctaLabel: 'Catch up' }
  }
  return { Icon: Circle, iconClass: 'text-muted-foreground/40', ctaLabel: null as string | null }
}

// ── Entries table ─────────────────────────────────────────────────────────────

function SchemeEntriesTable({
  entries,
  onCatchUp,
  loading,
}: {
  entries: PacingEntry[]
  onCatchUp: (topic: string) => void
  loading: (topic: string) => boolean
}) {
  const columns: ColumnDef<PacingEntry>[] = [
    {
      id: 'week',
      header: 'Week',
      accessorFn: (e) => e.week_number,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground tabular-nums">Wk {getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => {
        const entry = row.original
        const { Icon, iconClass } = entryStatus(entry)
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{formatTopicTitle(entry.topic)}</p>
              {entry.subtopics.length > 0 && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {entry.subtopics.slice(0, 2).map(formatTopicTitle).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: 'weight',
      header: 'Weight',
      accessorFn: (e) => e.curriculum_weight ?? -1,
      cell: ({ row }) => {
        const w = row.original.curriculum_weight
        return w !== null
          ? <span className="text-xs text-muted-foreground tabular-nums">{w.toFixed(0)}%</span>
          : <span className="text-xs text-muted-foreground/50">—</span>
      },
    },
    {
      id: 'mastery',
      header: 'Mastery',
      accessorFn: (e) => e.student_mastery ?? -1,
      cell: ({ row }) => {
        const entry = row.original
        if (entry.student_mastery !== null) {
          return (
            <span className={`text-xs tabular-nums font-medium ${
              entry.status === 'strong' ? 'text-emerald-600' :
              entry.status === 'developing' ? 'text-amber-600' : 'text-rose-600'
            }`}>{entry.student_mastery}%</span>
          )
        }
        return entry.is_due
          ? <span className="text-xs text-muted-foreground">not studied</span>
          : <span className="text-xs text-muted-foreground/50">upcoming</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const entry = row.original
        const { ctaLabel } = entryStatus(entry)
        if (!ctaLabel) return null
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2 py-0 gap-1"
            disabled={loading(entry.topic)}
            onClick={() => onCatchUp(entry.topic)}
          >
            {ctaLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={entries}
      filter={{ prompt: 'Search topics...', column: 'topic' }}
    />
  )
}

// ── Scheme panel ──────────────────────────────────────────────────────────────

function SchemePanel({ scheme }: { scheme: PacingScheme }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [activeTopic, setActiveTopic] = useState<string | null>(null)

  function handleCatchUp(topic: string) {
    setActiveTopic(topic)
    startTransition(async () => {
      const { data, error } = await initiateFreeStudyPlan(scheme.subject, topic)
      setActiveTopic(null)
      if (error) { toast.error(error.message); return }
      if (data?.plan_id) {
        toast.success('Study plan created!')
        router.push(`/student/study-plans/${data.plan_id}/studio`)
      }
    })
  }

  const { summary } = scheme
  const bloom = scheme.bloom_distribution ? normaliseBloom(scheme.bloom_distribution) : null

  return (
    <div className="space-y-4">
      {/* Motivational header — active term only */}
      {scheme.is_active && summary && (
        <Card>
          <CardContent className="pt-4 pb-3 space-y-3">
            {/* Headline */}
            <div>
              <p className="text-sm font-semibold">
                You&apos;ve mastered{' '}
                <span className="text-emerald-600">{summary.mastered}</span> of{' '}
                {summary.topics_due} topics due so far
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                <span>Expected: <strong>{summary.coverage_pct_expected}%</strong></span>
                <span>You&apos;re at: <strong className={summary.pacing_gap > 10 ? 'text-rose-600' : 'text-emerald-600'}>{summary.coverage_pct_actual}%</strong></span>
                {summary.pacing_gap > 0 && (
                  <span className="text-rose-500">{summary.pacing_gap}% behind</span>
                )}
              </div>
            </div>

            {/* Stacked progress bar */}
            <div className="space-y-1">
              <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                {summary.topics_due > 0 && (
                  <>
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(summary.mastered / summary.total_topics) * 100}%` }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${(summary.developing / summary.total_topics) * 100}%` }}
                    />
                    <div
                      className="h-full bg-rose-400 transition-all"
                      style={{ width: `${((summary.at_risk + summary.not_studied) / summary.total_topics) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />Mastered</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />Developing</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-rose-400" />Behind</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/20" />Not due yet</span>
              </div>
            </div>

            {/* Motivational nudge */}
            <div className="text-xs text-muted-foreground border-t pt-2 flex items-start gap-2">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gold" />
              <span>
                {summary.plans_per_week_needed > 0
                  ? <>Do <strong>{summary.plans_per_week_needed}</strong> more study plan{summary.plans_per_week_needed !== 1 ? 's' : ''}/week to stay on track. </>
                  : 'You are on track! Keep going. '}
                Projected coverage by term end:{' '}
                <strong className={summary.projected_coverage >= summary.coverage_pct_expected ? 'text-emerald-600' : 'text-amber-600'}>
                  {summary.projected_coverage}%
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloom's strip */}
      {bloom && bloom.length > 0 && (
        <Card>
          <CardContent className="pt-3 pb-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cognitive depth</p>
            {bloom.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums text-muted-foreground">{Math.round(value)}%</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground pt-1">
              Reach higher cognitive levels (Apply, Analyse, Evaluate) to improve exam performance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Week-by-week entries */}
      {scheme.entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-7 w-7 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No topics in this scheme</p>
          </CardContent>
        </Card>
      ) : (
        <SchemeEntriesTable
          entries={scheme.entries}
          onCatchUp={handleCatchUp}
          loading={(topic) => pending && activeTopic === topic}
        />
      )}
    </div>
  )
}

// ── Fallback topics table ────────────────────────────────────────────────────

function FallbackTopicsTable({
  topics,
  onStart,
}: {
  topics: NonNullable<PacingResponse['fallback_topics']>
  onStart: (subject: string, topic: string) => void
}) {
  const columns: ColumnDef<NonNullable<PacingResponse['fallback_topics']>[number]>[] = [
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{formatTopicTitle(row.original.topic)}</p>
          <p className="text-xs text-muted-foreground">{row.original.subject}</p>
        </div>
      ),
    },
    {
      id: 'score',
      header: 'Avg Score',
      accessorFn: (t) => t.avg_score ?? -1,
      cell: ({ row }) =>
        row.original.avg_score !== null
          ? <span className="text-xs tabular-nums text-muted-foreground">{row.original.avg_score}%</span>
          : <span className="text-xs text-muted-foreground/50">—</span>,
    },
    {
      id: 'plans',
      header: 'Plans',
      accessorFn: (t) => t.plan_count,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.plan_count} plan{row.original.plan_count !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[11px] px-2 gap-1"
          onClick={() => onStart(row.original.subject, row.original.topic)}
        >
          Study <ArrowRight className="h-3 w-3" />
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={topics}
      filter={{ prompt: 'Search topics...', column: 'topic' }}
    />
  )
}

// ── Fallback: no SoW ──────────────────────────────────────────────────────────

function FallbackPanel({ topics }: { topics: PacingResponse['fallback_topics'] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  if (!topics?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No scheme of work assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your teacher will set up the syllabus. Complete study plans to see your progress here.
          </p>
        </CardContent>
      </Card>
    )
  }

  function handleStart(subject: string, topic: string) {
    startTransition(async () => {
      const { data, error } = await initiateFreeStudyPlan(subject, topic)
      if (error) { toast.error(error.message); return }
      if (data?.plan_id) {
        toast.success('Study plan created!')
        router.push(`/student/study-plans/${data.plan_id}/studio`)
      }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Focus on highest-weight topics first to maximise your exam score.
      </p>
      <FallbackTopicsTable topics={topics} onStart={handleStart} />
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export function SyllabusTab({ data }: { data: PacingResponse }) {
  const activeSchemes = data.schemes.filter((s) => s.is_active)
  const otherSchemes  = data.schemes.filter((s) => !s.is_active)

  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeSchemes[0]?.subject ?? otherSchemes[0]?.subject ?? '',
  )

  if (!data.has_sow) {
    return (
      <div className="space-y-3">
        <FallbackPanel topics={data.fallback_topics} />
      </div>
    )
  }

  // A subject can legitimately have more than one linked scheme (e.g. Term 1
  // active + Term 2 draft) but should only ever show one chip — dedupe by
  // subject, preferring the active one, so a duplicate/mis-scoped scheme
  // (see the 2026-08-10 History and Political Education incident) can't
  // resurface this as a visible bug even if it recurs in the data.
  const allSchemesRaw = [...activeSchemes, ...otherSchemes]
  const seenSubjects = new Set<string>()
  const allSchemes = allSchemesRaw.filter((s) => {
    if (seenSubjects.has(s.subject)) return false
    seenSubjects.add(s.subject)
    return true
  })
  const current = allSchemes.find((s) => s.subject === selectedSubject) ?? allSchemes[0]

  return (
    <div className="space-y-3">
      {/* Subject selector if multiple schemes */}
      {allSchemes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {allSchemes.map((s) => (
            <button
              key={s.scheme_id}
              onClick={() => setSelectedSubject(s.subject)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedSubject === s.subject
                  ? 'bg-gold text-gold-foreground border-gold'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.subject}
              {s.is_active && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Header for non-active terms */}
      {current && !current.is_active && (
        <p className="text-xs text-muted-foreground">
          {current.term} — topics for reference only (not the current term)
        </p>
      )}

      {current && <SchemePanel scheme={current} />}
    </div>
  )
}
