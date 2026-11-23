// src/components/students/foundation-note.tsx
//
// Explains a "foundation" lesson — one the platform scheduled because a later
// topic the student is struggling with depends on it (possibly from an earlier
// class year; see mark-api prerequisite-graph.ts). Framed as unlocking the
// harder topic, never as "you are behind".

import { Layers } from 'lucide-react'
import { cn, formatTopicTitle } from '@/lib/utils'

export interface LessonRemediation {
  kind: 'foundation'
  for_topic: string
  class_level: string | null
  evidence: 'weak' | 'unassessed'
}

/** Reads `content.remediation` off any plan-like object, defensively. */
export function remediationOf(plan: { content?: unknown } | null | undefined): LessonRemediation | null {
  const r = (plan?.content as { remediation?: LessonRemediation } | null | undefined)?.remediation
  return r && r.kind === 'foundation' && r.for_topic ? r : null
}

export function FoundationNote({
  remediation,
  variant = 'inline',
  className,
}: {
  remediation: LessonRemediation | null
  variant?: 'inline' | 'banner'
  className?: string
}) {
  if (!remediation) return null
  const target = formatTopicTitle(remediation.for_topic)
  const year = remediation.class_level ? ` (${remediation.class_level})` : ''

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2.5 text-xs leading-relaxed',
          className,
        )}
      >
        <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
        <p>
          <span className="font-semibold">Building a foundation{year}.</span>{' '}
          {remediation.evidence === 'weak'
            ? 'Your recent answers show this is worth strengthening — '
            : 'This is the step underneath — '}
          it&apos;s what makes <span className="font-semibold">{target}</span> click. We&apos;ll connect the two at the end.
        </p>
      </div>
    )
  }

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground', className)}>
      <Layers className="h-3 w-3 shrink-0 text-gold" aria-hidden />
      <span className="truncate">
        Foundation{year} · unlocks {target}
      </span>
    </span>
  )
}
