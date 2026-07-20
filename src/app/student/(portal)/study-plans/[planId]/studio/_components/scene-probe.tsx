'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface Props {
  scene:     any
  onAnswer:  (correct: boolean, selectedText: string) => void
  onReady?:  () => void
}

export function SceneProbe({ scene, onAnswer, onReady }: Props) {
  const { title, content } = scene
  const { question, options, correct, brief_explanation } = content ?? {}
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null

  function handleSelect(i: number) {
    if (answered) return
    setSelected(i)
    onAnswer(i === correct, options[i] ?? '')
    onReady?.()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-4 py-2.5 text-sm text-violet-700 dark:text-violet-300 font-medium">
        What do you already think?
      </div>

      <h2 className="font-bold text-2xl leading-tight">{title}</h2>

      <div className="rounded-2xl border bg-card px-5 py-4">
        <p className="font-medium text-lg leading-snug"><LessonProse text={question} /></p>
      </div>

      <div className="space-y-2.5">
        {(options ?? []).map((opt: string, i: number) => {
          const isCorrect  = i === correct
          const isSelected = i === selected
          let cls = 'border bg-card text-foreground hover:bg-muted/50'
          if (answered && isCorrect)                cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
          if (answered && isSelected && !isCorrect) cls = 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200'

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => handleSelect(i)}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base transition-colors ${cls}`}
            >
              <span className="shrink-0 h-7 w-7 rounded-full border flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 leading-snug"><LessonProse text={opt} /></span>
              {answered && isCorrect                && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle      className="h-4 w-4 text-rose-500 shrink-0" />}
            </button>
          )
        })}
      </div>

      {answered && brief_explanation && (
        <div className="rounded-xl border border-muted bg-muted/40 px-4 py-3 text-sm text-foreground/80 leading-relaxed">
          <LessonProse text={brief_explanation} />
        </div>
      )}
    </div>
  )
}
