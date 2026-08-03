'use client'

// src/components/reteach/word-origin-card.tsx
//
// Shared etymology/word-origin renderer. Originally built only for the
// teacher-facing reteach session view (`ReteachSessionContent`) — extracted so
// the exact same AI-generated { term, language_origin, root_breakdown,
// intuition_bridge, related_terms } shape can be reused anywhere a difficult
// word shows up for a student (lesson scenes, Tracy, Knowledge Base), not just
// inside a teacher-triggered remediation session.

import { useState } from 'react'
import { ChevronDown, ChevronRight, Languages } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ReteachEtymologyNote } from '@/lib/actions/reteach'

interface WordOriginCardProps {
  note: ReteachEtymologyNote
  /** 'block' = collapsible card (reteach sessions). 'inline' = a small tappable
   *  word/pill that reveals the same content in a popover, for use mid-sentence
   *  inside lesson prose. */
  variant?: 'block' | 'inline'
  defaultOpen?: boolean
}

function OriginBody({ note }: { note: ReteachEtymologyNote }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
        {note.language_origin}: {note.root_breakdown}
      </p>
      <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        {note.intuition_bridge}
      </p>
      {note.related_terms.length > 0 && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          See also: {note.related_terms.join(' · ')}
        </p>
      )}
    </div>
  )
}

export function WordOriginCard({ note, variant = 'block', defaultOpen = true }: WordOriginCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (variant === 'inline') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="underline decoration-dotted decoration-amber-500 underline-offset-2 text-inherit font-medium hover:text-amber-700 dark:hover:text-amber-300"
            aria-label={`Word origin of "${note.term}"`}
          >
            {note.term}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur-md border-amber-200 dark:border-amber-800 shadow-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <Languages className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
              Word origin: &ldquo;{note.term}&rdquo;
            </span>
          </div>
          <OriginBody note={note} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
            Word origin: &ldquo;{note.term}&rdquo;
          </span>
        </div>
        {open
          ? <ChevronDown className="h-3 w-3 text-amber-400" />
          : <ChevronRight className="h-3 w-3 text-amber-400" />
        }
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-amber-200 dark:border-amber-800">
          <OriginBody note={note} />
        </div>
      )}
    </div>
  )
}
