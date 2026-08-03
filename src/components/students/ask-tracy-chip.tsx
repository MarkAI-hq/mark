// src/components/students/ask-tracy-chip.tsx
//
// A small, contextual entry point into Tracy from wherever a struggle signal
// already exists in data the page is loading anyway (an at-risk mastery badge,
// a behind-pace schedule, a missed quiz answer). Deep-links into
// /student/tracy?prompt=... so Tracy's composer arrives pre-filled with the
// specific subject/topic/misconception instead of a blank chat the student
// has to reconstruct context for themselves.

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface AskTracyChipProps {
  prompt: string
  label?: string
  className?: string
}

export function AskTracyChip({ prompt, label = 'Ask Tracy', className = '' }: AskTracyChipProps) {
  return (
    <Link
      href={`/student/tracy?prompt=${encodeURIComponent(prompt)}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold hover:bg-gold/20 transition-colors ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </Link>
  )
}
