'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowRight,
  RefreshCw,
  RotateCcw,
  ChevronRight,
  Clock,
} from 'lucide-react'

import { type AssessmentSubmission, retrySubmission } from '@/lib/actions/submissions'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { cn }      from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type GradingStatus = NonNullable<AssessmentSubmission['grading_status']>

interface StudentGroup {
  studentId:   string
  studentName: string
  canonical:   AssessmentSubmission
  history:     AssessmentSubmission[]
}

// ── Grouping logic ─────────────────────────────────────────────────────────

function groupSubmissions(submissions: AssessmentSubmission[]): StudentGroup[] {
  const map = new Map<string, AssessmentSubmission[]>()

  for (const s of submissions) {
    map.set(s.student_id, [...(map.get(s.student_id) ?? []), s])
  }

  return Array.from(map.values()).map((attempts) => {
    // Sort newest first so canonical is always the most recent attempt
    const sorted    = [...attempts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    // Most recent COMPLETED wins; otherwise fall back to most recent attempt
    const completed = sorted.find((a) => a.grading_status === 'COMPLETED')
    const canonical = completed ?? sorted[0]
    const history   = sorted.filter((a) => a.submission_id !== canonical.submission_id)

    return {
      studentId:   canonical.student_id,
      studentName: canonical.student_name,
      canonical,
      history,
    }
  })
}

// ── Status badge ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  GradingStatus | 'NOT_SUBMITTED',
  { label: string; className: string }
> = {
  COMPLETED:     { label: 'Graded',        className: 'bg-green-50  text-green-800  border-green-200'  },
  PROCESSING:    { label: 'Processing',    className: 'bg-amber-50  text-amber-800  border-amber-200'  },
  PENDING:       { label: 'In queue',      className: 'bg-gray-50   text-gray-600   border-gray-200'   },
  FAILED:        { label: 'Failed',        className: 'bg-red-50    text-red-700    border-red-200'     },
  NOT_SUBMITTED: { label: 'Not submitted', className: 'bg-gray-50   text-gray-400   border-gray-200'   },
}

function StatusBadge({ status }: { status: GradingStatus | null }) {
  const key    = status ?? 'NOT_SUBMITTED'
  const config = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NOT_SUBMITTED

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium gap-1.5 whitespace-nowrap', config.className)}
    >
      {(status === 'PROCESSING' || status === 'PENDING') && (
        <Clock className="h-3 w-3" />
      )}
      {config.label}
    </Badge>
  )
}

// ── History drawer row ─────────────────────────────────────────────────────

function HistoryRow({
  submission,
  assessmentId,
  retrying,
  onRegrade,
}: {
  submission:   AssessmentSubmission
  assessmentId: string
  retrying:     boolean
  onRegrade:    (id: string) => void
}) {
  const isFailed     = submission.grading_status === 'FAILED'
  const isProcessing =
    submission.grading_status === 'PROCESSING' || submission.grading_status === 'PENDING'

  return (
    <tr className="bg-muted/30 border-b border-border/50">
      <td colSpan={4} className="px-4 py-2 pl-[3.75rem]">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              isFailed     && 'bg-red-400',
              isProcessing && 'bg-amber-400',
            )}
          />

          <span>
            {isFailed
              ? submission.error_message
                ? `Failed: ${submission.error_message}`
                : 'A previous grading attempt failed'
              : 'Another grading job is still running — will resolve shortly'}
          </span>

          {isFailed && (
            <Button
              variant="ghost"
              size="sm"
              disabled={retrying}
              onClick={() => onRegrade(submission.submission_id)}
              className="h-6 px-2 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive ml-1"
            >
              <RotateCcw className={cn('h-3 w-3 mr-1', retrying && 'animate-spin')} />
              {retrying ? 'Retrying…' : 'Regrade'}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Student row ────────────────────────────────────────────────────────────

function StudentRow({
  group,
  assessmentId,
  retrying,
  onRegrade,
}: {
  group:        StudentGroup
  assessmentId: string
  retrying:     Set<string>
  onRegrade:    (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { canonical, history }  = group
  const hasHistory              = history.length > 0
  const isFailed                = canonical.grading_status === 'FAILED'
  const isCanonicalRetrying     = retrying.has(canonical.submission_id)

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/40 transition-colors">

        {/* Student name + expand toggle */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0 select-none">
              {group.studentName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-medium leading-tight">{group.studentName}</p>

              {/* Inline failure reason under name for canonical failed row */}
              {isFailed && canonical.error_message && (
                <p className="text-xs text-destructive/80 mt-0.5 max-w-xs truncate">
                  {canonical.error_message}
                </p>
              )}

              {hasHistory && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 transition-transform duration-150',
                      expanded && 'rotate-90',
                    )}
                  />
                  {(() => {
                    const failed     = history.filter((h) => h.grading_status === 'FAILED').length
                    const processing = history.filter(
                      (h) => h.grading_status === 'PROCESSING' || h.grading_status === 'PENDING',
                    ).length
                    const parts: string[] = []
                    if (failed > 0)     parts.push(`${failed} failed attempt${failed !== 1 ? 's' : ''}`)
                    if (processing > 0) parts.push(`${processing} still grading`)
                    return parts.join(' · ')
                  })()}
                </button>
              )}
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={canonical.grading_status} />
        </td>

        {/* Score */}
        <td className="px-4 py-3">
          {canonical.total_score !== null && canonical.total_score !== undefined ? (
            <span className="text-sm font-medium tabular-nums">{canonical.total_score}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </td>

        {/* Action */}
        <td className="px-4 py-3">
          {isFailed ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isCanonicalRetrying}
              onClick={() => onRegrade(canonical.submission_id)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
            >
              <RotateCcw className={cn('h-3.5 w-3.5', isCanonicalRetrying && 'animate-spin')} />
              {isCanonicalRetrying ? 'Regrading…' : 'Regrade'}
            </Button>
          ) : canonical.grading_status === 'COMPLETED' ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/assessments/${assessmentId}/results/${canonical.submission_id}`}>
                View Report
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </td>
      </tr>

      {/* Expanded history */}
      {expanded &&
        history.map((s) => (
          <HistoryRow
            key={s.submission_id}
            submission={s}
            assessmentId={assessmentId}
            retrying={retrying.has(s.submission_id)}
            onRegrade={onRegrade}
          />
        ))}
    </>
  )
}

// ── SubmissionsListClient (exported) ───────────────────────────────────────

interface SubmissionsListClientProps {
  initialSubmissions: AssessmentSubmission[]
  assessmentId:       string
}

export function SubmissionsListClient({
  initialSubmissions,
  assessmentId,
}: SubmissionsListClientProps) {
  const router                       = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [retrying, setRetrying]      = useState<Set<string>>(new Set())
  const [search, setSearch]          = useState('')

  const handleRegrade = async (submissionId: string) => {
    setRetrying((prev) => new Set(prev).add(submissionId))
    try {
      const { error } = await retrySubmission(submissionId)
      if (error) {
        toast.error('Regrade failed', { description: error.message })
        return
      }
      toast.success('Regrade started', {
        description: 'Mirror is resuming grading from where it stopped.',
      })
      router.refresh()
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev)
        next.delete(submissionId)
        return next
      })
    }
  }

  const handleRefresh = () => startRefresh(() => router.refresh())

  const groups = useMemo(() => {
    const all   = groupSubmissions(initialSubmissions)
    const query = search.trim().toLowerCase()
    if (!query) return all
    return all.filter((g) => g.studentName.toLowerCase().includes(query))
  }, [initialSubmissions, search])

  const allGroups    = useMemo(() => groupSubmissions(initialSubmissions), [initialSubmissions])
  const gradedCount  = allGroups.filter((g) => g.canonical.grading_status === 'COMPLETED').length
  const failedCount  = allGroups.filter((g) => g.canonical.grading_status === 'FAILED').length
  const pendingCount = allGroups.filter(
    (g) => g.canonical.grading_status === 'PENDING' || g.canonical.grading_status === 'PROCESSING',
  ).length
  const withHistory  = allGroups.filter((g) => g.history.length > 0).length

  return (
    <div className="space-y-4">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 flex-shrink-0"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-[40%]">
                Student
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Score
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {search ? `No students match "${search}"` : 'No submissions yet.'}
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <StudentRow
                  key={group.studentId}
                  group={group}
                  assessmentId={assessmentId}
                  retrying={retrying}
                  onRegrade={handleRegrade}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      {allGroups.length > 0 && (
        <p className="text-xs text-muted-foreground px-0.5">
          {gradedCount} graded
          {pendingCount > 0 && ` · ${pendingCount} processing`}
          {failedCount  > 0 && ` · ${failedCount} failed`}
          {withHistory  > 0 && ` · ${withHistory} student${withHistory !== 1 ? 's' : ''} with previous attempts`}
        </p>
      )}
    </div>
  )
}