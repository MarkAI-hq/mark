'use client'

import { useMemo, useState, useTransition } from 'react'
import { Search, BookOpenCheck, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getLearningHistory, type LearningHistoryResult } from '@/lib/actions/learning-history'

export function LearningHistoryClient({
  initial,
  error,
}: {
  initial: LearningHistoryResult
  error: string | null
}) {
  const [result, setResult] = useState(initial)
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const subjects = useMemo(() => {
    const set = new Set<string>()
    initial.submissions.forEach((s) => set.add(s.subject))
    initial.mastery.forEach((m) => set.add(m.subject))
    return [...set].filter(Boolean).sort()
  }, [initial])

  function runSearch(nextQuery: string, nextSubject: string | null) {
    startTransition(async () => {
      const { data } = await getLearningHistory({
        q: nextQuery || undefined,
        subject: nextSubject || undefined,
      })
      if (data) setResult(data)
    })
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
              runSearch(e.target.value, subject)
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
          <div className="space-y-2">
            {result.submissions.map((s) => (
              <Card key={s.submission_id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpenCheck className="h-4 w-4 text-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {s.total_score != null && s.max_score != null && (
                      <p className="text-sm font-semibold">{s.total_score}/{s.max_score}</p>
                    )}
                    {s.graded_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.graded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Topic mastery
        </h2>
        {result.mastery.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topic history yet.</p>
        ) : (
          <div className="space-y-2">
            {result.mastery.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Target className="h-4 w-4 text-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.topic}</p>
                      <p className="text-xs text-muted-foreground">{m.subject}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {m.achieved_count}/{m.attempted_count}
                    </p>
                    {m.last_attempted_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.last_attempted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
