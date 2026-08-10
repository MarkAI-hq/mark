'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Search, BookOpenCheck, Target, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  getLearningHistory,
  type LearningHistoryResult,
  type LearningHistorySubmission,
  type LearningHistoryLesson,
  type LearningHistoryMastery,
} from '@/lib/actions/learning-history'
import { formatTopicTitle } from '@/lib/utils'

const submissionColumns: ColumnDef<LearningHistorySubmission>[] = [
  {
    accessorKey: 'title',
    header: 'Assessment',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-0">
        <BookOpenCheck className="h-4 w-4 text-gold shrink-0" />
        <span className="font-medium truncate">{row.original.title}</span>
      </div>
    ),
  },
  { accessorKey: 'subject', header: 'Subject', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()}</span> },
  {
    id: 'score',
    header: 'Score',
    cell: ({ row }) => {
      const { total_score, max_score } = row.original
      return total_score != null && max_score != null
        ? <span className="text-sm font-semibold">{total_score}/{max_score}</span>
        : <span className="text-xs text-muted-foreground/50">—</span>
    },
  },
  {
    id: 'graded_at',
    header: 'Graded',
    cell: ({ row }) => row.original.graded_at
      ? <span className="text-xs text-muted-foreground">{new Date(row.original.graded_at).toLocaleDateString()}</span>
      : null,
  },
]

const masteryColumns: ColumnDef<LearningHistoryMastery>[] = [
  {
    accessorKey: 'topic',
    header: 'Topic',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-0">
        <Target className="h-4 w-4 text-gold shrink-0" />
        <span className="font-medium truncate">{formatTopicTitle(row.original.topic)}</span>
      </div>
    ),
  },
  { accessorKey: 'subject', header: 'Subject', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()}</span> },
  {
    id: 'mastery',
    header: 'Mastery',
    cell: ({ row }) => <span className="text-sm font-semibold">{row.original.achieved_count}/{row.original.attempted_count}</span>,
  },
  {
    id: 'last_attempted_at',
    header: 'Last attempt',
    cell: ({ row }) => row.original.last_attempted_at
      ? <span className="text-xs text-muted-foreground">{new Date(row.original.last_attempted_at).toLocaleDateString()}</span>
      : null,
  },
]

export function LearningHistoryClient({
  initial,
  error,
}: {
  initial: LearningHistoryResult
  error: string | null
}) {
  const router = useRouter()
  const [result, setResult] = useState(initial)
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const subjects = useMemo(() => {
    const set = new Set<string>()
    initial.submissions.forEach((s) => set.add(s.subject))
    initial.mastery.forEach((m) => set.add(m.subject))
    initial.lessons.forEach((l) => set.add(l.subject))
    return [...set].filter(Boolean).sort()
  }, [initial])

  const lessonColumns = useMemo<ColumnDef<LearningHistoryLesson>[]>(() => [
    {
      accessorKey: 'topic',
      header: 'Lesson',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-gold shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{formatTopicTitle(row.original.topic)}</p>
            <p className="text-xs text-muted-foreground capitalize">{row.original.lesson_type.replace(/_/g, ' ')}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: 'subject', header: 'Subject', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()}</span> },
    {
      id: 'score_after',
      header: 'Score',
      cell: ({ row }) => row.original.score_after != null
        ? <span className="text-sm font-semibold">{row.original.score_after}%</span>
        : <span className="text-xs text-muted-foreground/50">—</span>,
    },
    {
      id: 'completed_at',
      header: 'Completed',
      cell: ({ row }) => row.original.completed_at
        ? <span className="text-xs text-muted-foreground">{new Date(row.original.completed_at).toLocaleDateString()}</span>
        : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-gold"
          onClick={() => router.push(`/student/study-plans/${row.original.id}/studio?from=history`)}
        >
          Review
        </Button>
      ),
    },
  ], [router])

  function runSearch(nextQuery: string, nextSubject: string | null) {
    startTransition(async () => {
      const { data } = await getLearningHistory({
        q: nextQuery || undefined,
        subject: nextSubject || undefined,
      })
      if (data) setResult(data)
    })
  }

  // Subject-badge clicks fire immediately; free-text typing debounces so we
  // don't re-fetch on every keystroke on a slow connection.
  function runSearchDebounced(nextQuery: string, nextSubject: string | null) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(nextQuery, nextSubject), 300)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Learning History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Everything you&apos;ve studied and been assessed on — searchable by topic or subject.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by topic or title…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              runSearchDebounced(e.target.value, subject)
            }}
          />
        </div>
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={subject === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setSubject(null)
                runSearch(query, null)
              }}
            >
              All subjects
            </Badge>
            {subjects.map((s) => (
              <Badge
                key={s}
                variant={subject === s ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  const next = subject === s ? null : s
                  setSubject(next)
                  runSearch(query, next)
                }}
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Assessments {isPending && <span className="normal-case">(updating…)</span>}
        </h2>
        {result.submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching assessments yet.</p>
        ) : (
          <DataTable columns={submissionColumns} data={result.submissions} />
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Lessons {isPending && <span className="normal-case">(updating…)</span>}
        </h2>
        {result.lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed lessons yet.</p>
        ) : (
          <DataTable columns={lessonColumns} data={result.lessons} />
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Topic mastery
        </h2>
        {result.mastery.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topic history yet.</p>
        ) : (
          <DataTable columns={masteryColumns} data={result.mastery} />
        )}
      </div>
    </div>
  )
}
