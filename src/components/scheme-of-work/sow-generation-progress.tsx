// src/components/scheme-of-work/sow-generation-progress.tsx
'use client'

// Scheme-of-work generation is a synchronous server action, not a queued
// Bull job like exam generation or grading — there's no real progress
// percentage to report. Rather than show a literal number that's fabricated,
// this gives the same visual language as GenerationProgress (exam-builder)
// with an honestly-indeterminate bar and rotating milestone copy, so the
// three AI-generation features in this app feel like one consistent system
// instead of two polished ones and a dead silent one.

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const MILESTONES = [
  'Reading the curriculum and term dates…',
  'Mapping topics across the weeks of the term…',
  'Writing learning objectives for each topic…',
  'Lining up assessments and checkpoints…',
  'Finishing touches…',
]

const MILESTONE_INTERVAL_MS = 8000

interface SowGenerationProgressProps {
  method: 'curriculum' | 'notes' | 'pdf'
}

const METHOD_LABEL: Record<SowGenerationProgressProps['method'], string> = {
  curriculum: 'Generating your scheme of work from the curriculum…',
  notes:      'Turning your notes into a scheme of work…',
  pdf:        'Extracting your scheme of work from the PDF…',
}

export function SowGenerationProgress({ method }: SowGenerationProgressProps) {
  const [milestoneIndex, setMilestoneIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMilestoneIndex((i) => Math.min(i + 1, MILESTONES.length - 1))
    }, MILESTONE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="w-full rounded-xl border border-border bg-card p-5 space-y-3.5">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{METHOD_LABEL[method]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{MILESTONES[milestoneIndex]}</p>
        </div>
      </div>

      {/* Indeterminate bar — no literal percentage, since there's no job to
          poll for a real one. The sliding segment communicates "still
          working," not a fabricated completion fraction. */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden relative">
        <div className="absolute inset-y-0 w-1/3 rounded-full bg-primary animate-progress-slide" />
      </div>

      <p className="text-xs text-muted-foreground">
        This usually takes 1–3 minutes depending on term length. Stay on this screen until it finishes.
      </p>
    </div>
  )
}
