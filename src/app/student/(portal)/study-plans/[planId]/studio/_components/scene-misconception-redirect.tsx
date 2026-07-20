'use client'

import { AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface Props { scene: any }

export function SceneMisconceptionRedirect({ scene }: Props) {
  const { title, content } = scene
  const { misconception, why_it_makes_sense, correct_understanding, analogy } = content ?? {}

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-2xl leading-tight">{title}</h2>

      <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-5 py-4 space-y-1">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          A common belief
        </div>
        <p className="text-rose-900 dark:text-rose-200 leading-relaxed"><LessonProse text={misconception} /></p>
      </div>

      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 space-y-1">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Here is why that makes sense</p>
        <p className="text-amber-900 dark:text-amber-200 leading-relaxed"><LessonProse text={why_it_makes_sense} /></p>
      </div>

      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4 space-y-1">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          What is actually true
        </div>
        <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed"><LessonProse text={correct_understanding} /></p>
      </div>

      {analogy && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 space-y-1">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
            <Lightbulb className="h-4 w-4 shrink-0" />
            Think of it this way
          </div>
          <p className="text-blue-900 dark:text-blue-200 leading-relaxed"><LessonProse text={analogy} /></p>
        </div>
      )}
    </div>
  )
}
