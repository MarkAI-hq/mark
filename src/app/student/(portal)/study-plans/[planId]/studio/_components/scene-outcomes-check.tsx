'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OutcomesCheckItem {
  outcome: string
  curriculum_ref: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface Props {
  scene: any
  onReady: () => void
  onOutcomesAchieved: (achievedRefs: string[]) => void
}

export function SceneOutcomesCheck({ scene, onReady, onOutcomesAchieved }: Props) {
  const { items = [], topic = '' } = scene.content ?? {}
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(items.length).fill(null),
  )
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = answers.every((a) => a !== null)

  function handleSelect(itemIdx: number, optIdx: number) {
    if (submitted || answers[itemIdx] !== null) return
    setAnswers((prev) => {
      const next = [...prev]
      next[itemIdx] = optIdx
      return next
    })
  }

  function handleSubmit() {
    if (!allAnswered || submitted) return
    const achievedRefs: string[] = []
    for (let i = 0; i < items.length; i++) {
      if (answers[i] === items[i].correct && items[i].curriculum_ref) {
        achievedRefs.push(items[i].curriculum_ref)
      }
    }
    setSubmitted(true)
    onOutcomesAchieved(achievedRefs)
    onReady()
  }

  const answeredCount = answers.filter((a) => a !== null).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-2.5">
        <Target className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
        <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
          Outcomes check — {topic}
        </span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {answeredCount} of {items.length} answered
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Answer one question per outcome. This is how we know what you have mastered.
      </p>

      {items.map((item: OutcomesCheckItem, itemIdx: number) => {
        const selected = answers[itemIdx]
        const answered = selected !== null

        return (
          <div key={itemIdx} className="rounded-2xl border bg-card overflow-hidden">
            {/* Outcome label */}
            <div className="px-5 py-3 border-b bg-muted/40">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[11px] font-bold">
                  {itemIdx + 1}
                </span>
                <p className="text-xs text-muted-foreground leading-snug">
                  {item.outcome}
                </p>
              </div>
            </div>

            {/* Question */}
            <div className="px-5 pt-4 pb-3">
              <p className="font-medium text-base leading-snug">{item.question}</p>
            </div>

            {/* Options */}
            <div className="px-5 pb-4 space-y-2">
              {(item.options ?? []).map((opt: string, optIdx: number) => {
                const isCorrect  = optIdx === item.correct
                const isSelected = optIdx === selected
                let cls = 'border bg-card text-foreground hover:bg-muted/50'
                if (submitted && isCorrect)
                  cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
                if (submitted && isSelected && !isCorrect)
                  cls = 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200'
                if (!submitted && isSelected)
                  cls = 'border-primary bg-primary/5 text-foreground'

                return (
                  <button
                    key={optIdx}
                    disabled={submitted}
                    onClick={() => handleSelect(itemIdx, optIdx)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${cls}`}
                  >
                    <span className="shrink-0 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {submitted && isCorrect                && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    {submitted && isSelected && !isCorrect && <XCircle      className="h-4 w-4 text-rose-500 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Explanation after submit */}
            {submitted && item.explanation && (
              <div className="mx-5 mb-4 rounded-xl border border-muted bg-muted/40 px-4 py-3 text-sm text-foreground/80 leading-relaxed">
                {item.explanation}
              </div>
            )}
          </div>
        )
      })}

      {!submitted && (
        <Button
          className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
          disabled={!allAnswered}
          onClick={handleSubmit}
          title={!allAnswered ? 'Answer all questions first' : undefined}
        >
          Submit outcomes check
        </Button>
      )}

      {submitted && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 text-center font-medium">
          {answers.filter((a, i) => a === items[i]?.correct).length} of {items.length} outcomes achieved
        </div>
      )}
    </div>
  )
}
