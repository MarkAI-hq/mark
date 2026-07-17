'use client'

import { useState } from 'react'
import { Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { validateStudentInput, copyProtectionProps } from '@/lib/utils/validation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props { scene: any; onReady?: () => void }

export function ScenePeerTeach({ scene, onReady }: Props) {
  const { title, content } = scene
  const { prompt: teachPrompt, rubric_points, model_explanation, min_words = 30 } = content ?? {}
  const [text, setText]           = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const canSubmit = wordCount >= min_words && !submitted

  function handleSubmit() {
    const validation = validateStudentInput(text, teachPrompt ?? '', min_words)
    if (!validation.isValid) {
      setValidationError(validation.feedback ?? 'Invalid input')
      toast.error(validation.feedback ?? 'Invalid input')
      return
    }
    setValidationError(null)
    setSubmitted(true)
    onReady?.()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <Users className="h-4 w-4 text-gold shrink-0 mt-1" />
        <h2 className="font-bold text-2xl leading-tight">{title}</h2>
      </div>

      <div {...copyProtectionProps} className={cn('rounded-2xl border bg-card px-5 py-4', copyProtectionProps.className)}>
        <p className="text-base leading-relaxed">{teachPrompt}</p>
      </div>

      {!submitted ? (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setValidationError(null) }}
            placeholder="Write your explanation here…"
            className="min-h-32 resize-none text-base leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${wordCount >= min_words ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {wordCount} / {min_words} words minimum
            </span>
            <Button size="sm" disabled={!canSubmit} onClick={handleSubmit}>
              Submit to Tendo
            </Button>
          </div>
          {validationError && (
            <p className="text-xs text-rose-500 font-medium">⚠️ {validationError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-muted bg-muted/30 px-4 py-3 text-sm text-foreground/70 italic">
            {text}
          </div>

          {rubric_points?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/70">What a complete answer includes:</p>
              {rubric_points.map((point: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>
          )}

          {model_explanation && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4 space-y-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Model explanation</p>
              <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed text-base">{model_explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
