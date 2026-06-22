import { BookOpen, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Citation } from '@/lib/types'

export type { Citation }

/**
 * Renders the syllabus provenance for any AI output (study plans, graded answers,
 * reteach sessions, exams). "Sources consulted" — what the AI was grounded in.
 * Returns null when there are no citations, so it's safe to drop in anywhere.
 */
export function SourcesConsulted({
  citations,
  className,
  title = 'Grounded in the official syllabus',
  grounded,
}: {
  citations?: Citation[] | null
  className?: string
  title?: string
  /**
   * When explicitly `false` and there are no citations, render a visible
   * "not grounded" notice instead of nothing — so an ungrounded AI output is
   * never silent. Leave undefined to keep the old null-when-empty behaviour.
   */
  grounded?: boolean
}) {
  if (!citations || citations.length === 0) {
    if (grounded === false) {
      return (
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400',
            className,
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Not yet grounded to the official syllabus — generated without a matched
          curriculum source.
        </div>
      )
    }
    return null
  }

  // De-duplicate — retrieval can surface the same page across several chunks.
  const seen = new Set<string>()
  const unique = citations.filter((c) => {
    const key = `${c.source}|${c.page}|${c.topic}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className={cn('rounded-lg border bg-muted/30 p-3', className)}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" /> {title}
      </div>
      <ul className="space-y-1">
        {unique.map((c, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            {c.source ?? 'Curriculum'}
            {c.topic ? <> — {c.topic}</> : null}
            {c.class ? <span className="ml-1 opacity-70">({c.class})</span> : null}
            {c.page != null ? (
              <span className="ml-1 font-medium">· p.{c.page}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
