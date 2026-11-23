'use client'

// src/components/students/ask-tracy-chip.tsx
//
// A small, contextual entry point into the assistant from wherever a struggle signal
// already exists in data the page is loading anyway (an at-risk mastery badge,
// a behind-pace schedule, a missed quiz answer). It opens the slide-in assistant
// panel right where the student is, and asks the specific subject/topic/
// misconception straight away — no new tab, no leaving a lesson half-done.
//
// Callers pass phrases like "Struggling? Ask Tracy"; the word "Tracy" is swapped for
// whatever this student has named their assistant, so no caller has to know.

import { Sparkles } from 'lucide-react'
import { useAssistantName, withAssistantName } from '@/hooks/use-assistant-name'
import { openAssistantPanel } from '@/signals/assistant-panel'

interface AskTracyChipProps {
  prompt: string
  label?: string
  className?: string
  /** @deprecated The chip now always opens the in-place panel; kept so existing callers compile. */
  newTab?: boolean
}

export function AskTracyChip({ prompt, label = 'Ask Tracy', className = '' }: AskTracyChipProps) {
  const name = useAssistantName()
  return (
    <button
      type="button"
      onClick={() => openAssistantPanel(prompt)}
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold hover:bg-gold/20 transition-colors ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      {withAssistantName(label, name)}
    </button>
  )
}
