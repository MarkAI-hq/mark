'use client'

import { useState } from 'react'
import { Zap, CheckCircle2, XCircle } from 'lucide-react'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface FlashQuestion {
  question: string
  options: string[]
  correct: number
  topic: string
  plan_id: string
  days_ago: number
}

interface Props {
  scene: any
  onReady?: () => void
  onResponse?: (response: { type: string; correct: boolean }) => void
}

export function SceneRetrievalFlash({ scene, onReady, onResponse }: Props) {
  const { title, content } = scene
  const questions: FlashQuestion[] = content?.questions ?? []
  const [answers, setAnswers] = useState<Record<number, number>>({})

  function handleSelect(qIdx: number, optIdx: number) {
    if (answers[qIdx] !== undefined) return
    const next = { ...answers, [qIdx]: optIdx }
    setAnswers(next)
    onResponse?.({ type: 'retrieval_flash', correct: optIdx === questions[qIdx]?.correct })
    if (Object.keys(next).length >= questions.length && questions.length > 0) {
      onReady?.()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <Zap className="h-4 w-4 text-gold shrink-0 mt-1" />
        <div>
          <h2 className="font-bold text-2xl leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Warm up your memory</p>
        </div>
      </div>

      {questions.map((q, qIdx) => {
        const answered = answers[qIdx] !== undefined

        return (
          <div key={qIdx} className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-base leading-snug flex-1"><LessonProse text={q.question} /></p>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                {q.topic} · {q.days_ago}d ago
              </span>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, oIdx) => {
                const isCorrect  = oIdx === q.correct
                const isSelected = answers[qIdx] === oIdx
                let cls = 'border bg-background hover:bg-muted/50 text-foreground'
                if (answered && isCorrect)                cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
                if (answered && isSelected && !isCorrect) cls = 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200'

                return (
                  <button
                    key={oIdx}
                    disabled={answered}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${cls}`}
                  >
                    <span className="shrink-0 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="flex-1"><LessonProse text={opt} /></span>
                    {answered && isCorrect                && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    {answered && isSelected && !isCorrect && <XCircle      className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
