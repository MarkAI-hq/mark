// src/components/tracy/ask-tracy-chip.tsx
//
// Teacher-side counterpart to src/components/students/ask-tracy-chip.tsx —
// a small, contextual entry point into Tracy from wherever a real signal
// already exists in data the page is loading anyway (a failed audit, a
// just-finished grading run, an at-risk attendance list). Deep-links into
// /dashboard/tracy?prompt=... so Tracy's composer arrives pre-filled with
// the specific context instead of a blank chat the teacher has to
// reconstruct themselves.

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
      href={`/dashboard/tracy?prompt=${encodeURIComponent(prompt)}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold hover:bg-gold/20 transition-colors ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </Link>
  )
}
